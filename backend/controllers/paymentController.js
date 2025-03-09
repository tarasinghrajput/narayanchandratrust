require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { validationResult } = require("express-validator");
const Invoice = require("../models/Invoice"); // ✅ Ensure you import Invoice model
const Student = require("../models/Student"); // ✅ Ensure you import Student model
const Payments = require("../models/Payments");
// const nodemailer = require("nodemailer");*



exports.getPaymentsByStudent = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    const { student } = req.body;
    try {
        // console.log("📩 Fetching payments for student ID:", student);
        const payments = await Payments.find({ student: student });

        success = true;
        res.status(200).json({ success, payments });
    } catch (error) {
        console.error("❌ Error fetching payments:", error);
        res.status(500).json({ success, message: "Server error while fetching payments" });
    }
};


exports.createSession = async (req, res) => {
    try {

        const { studentId, amount, payment } = req.body;

        if (!studentId || !amount) {
            return res.status(400).json({ success: false, message: "Missing studentId or amount." });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found." });
        }

        const invoice = await Invoice.findOne({ student: student._id, status: "pending" });
        if (!invoice) {
            return res.status(400).json({ success: false, message: "Invoice already paid or not found." });
        }

        // ✅ FIX: Don't use session.id before it's assigned
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: { name: invoice.title },
                        unit_amount: invoice.amount * 100, // Convert to paise
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            billing_address_collection: "required",
            shipping_address_collection: { allowed_countries: ["IN"] },
            success_url: `http://localhost:5173/student-dashboard/invoices?success=true&session_id=SESSION_ID_PLACEHOLDER`,
            cancel_url: "http://localhost:5173/student-dashboard/invoices?canceled=true",
        });

        session.success_url = `http://localhost:5173/student-dashboard/invoices?success=true&session_id=${session.id}`;

        console.log("✅ Stripe Checkout Session Created:", session);
        res.json({ success: true, sessionUrl: session.url });

    } catch (error) {
        console.error("❌ Stripe session creation failed:", error.message);
        res.status(500).json({ success: false, message: "Stripe session creation failed." });
    }
};


exports.handleStripeWebhook = async (req, res) => {
    let event;

    try {
        const rawBody = req.rawBody;
        const sig = req.headers["stripe-signature"];
        event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("❌ Stripe Webhook Signature Verification Failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ✅ Handle Payment Success
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const studentEmail = session.customer_email;

        console.log("✅ Payment Successful for:", studentEmail);

        // ✅ Find student & update invoice
        const student = await Student.findOne({ email: studentEmail });
        const invoice = await Invoice.findOne({ student: student._id });
        if (student) {
            await Invoice.findOneAndUpdate(
                { student: student._id, status: "pending" },
                { status: "paid" }
            );
            await Payments.findOneAndUpdate(
                { invoice: invoice._id },
                { paymentStatus: "completed", paymentId: session.payment_intent }
            );
            console.log("✅ Invoice updated to PAID");
        }
    }

    res.status(200).send("Webhook received.");
};

exports.stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];

    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const studentEmail = session.customer_email;

            // ✅ Find the Invoice & Mark as Paid
            const student = await Student.findOne({ email: studentEmail });
            const invoice = await Invoice.findOne({ student: student._id, status: "pending" });

            if (invoice) {
                invoice.status = "paid";
                invoice.date = new Date();
                await invoice.save();
            }

            // ✅ Store Payment in Payments Collection
            const newPayment = new Payments({
                student: student._id,
                invoice: invoice?._id || null,
                amount: session.amount_total / 100,
                stripeSessionId: session.id,
                paymentMethod: "Stripe",
                paymentStatus: "completed",
                date: new Date(),
            });

            await newPayment.save();
        }

        res.json({ received: true });
    } catch (err) {
        console.error("❌ Webhook Error:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
};


exports.storePayment = async (req, res) => {
    const { studentId, amount, status, paymentId } = req.body;

    const invoice = await Invoice.findOne({ Student: studentId })

    try {
        const newPayment = new Payments({
            student: studentId,
            invoice: invoice._id,
            amount: amount,
            paymentId: paymentId,
            paymentStatus: status,
            date: new Date(),
        });

        await newPayment.save();
        res.status(201).json({ success: true, message: "Payment stored successfully!" });
    } catch (error) {
        console.error("❌ Error storing payment:", error);
        res.status(500).json({ success: false, message: "Error storing payment" });
    }
};

// exports.confirmPayment = async (req, res) => {
//     const { studentId, paymentId } = req.body;

//     try {
//         // ✅ Step 1: Find and update the payment to "Completed"
//         const payment = await Payments.findById(paymentId);
//         if (!payment || payment.paymentStatus !== "pending") {
//             return res.status(400).json({ success: false, message: "Invalid or already processed payment." });
//         }

//         payment.paymentStatus = "Completed";
//         await payment.save();

//         // ✅ Step 2: Find the invoice and mark it as "paid"
//         const invoice = await Invoice.findOneAndUpdate(
//             { student: studentId, title: payment.title },
//             { $set: { status: "paid" } },
//             { new: true } // ✅ Returns the updated document
//         );

//         if (!invoice) {
//             return res.status(400).json({ success: false, message: "Invoice not found." });
//         }

//         console.log("✅ Invoice updated:", invoice);

//         res.status(200).json({ success: true, message: "Payment confirmed, invoice updated!", invoice });
//     } catch (error) {
//         console.error("❌ Error confirming payment:", error);
//         res.status(500).json({ success: false, message: "Server error while confirming payment" });
//     }
// };

