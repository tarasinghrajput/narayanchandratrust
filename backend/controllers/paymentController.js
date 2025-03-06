require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Invoice = require("../models/Invoice"); // ✅ Ensure you import Invoice model
const Student = require("../models/Student"); // ✅ Ensure you import Student model
const nodemailer = require("nodemailer");


exports.createSession = async (req, res) => {
    try {
        console.log("📩 Received payment request:", req.body);

        const { studentId, amount } = req.body;

        if (!studentId || !amount) {
            return res.status(400).json({ success: false, message: "Missing studentId or amount." });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found." });
        }

        const invoice = await Invoice.findOne({ student: studentId, status: "pending" });
        if (!invoice) {
            return res.status(400).json({ success: false, message: "Invoice already paid or not found." });
        }

        console.log("🔍 Invoice found:", invoice);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer_creation: "always",
            line_items: [
              {
                price_data: {
                  currency: "inr",
                  product_data: {
                    name: invoice.title,
                  },
                  unit_amount: invoice.amount * 100, // Stripe expects amount in paise
                },
                quantity: 1,
              },
            ],
            billing_address_collection: "required", // ✅ Collects billing address
            shipping_address_collection: {
              allowed_countries: ["IN"], // ✅ Restrict to India (modify as needed)
            },
            success_url: "http://localhost:5173/student-dashboard/invoices?success=true",
            cancel_url: "http://localhost:5173/student-dashboard/invoices?canceled=true",
          });          

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
        if (student) {
            await Invoice.findOneAndUpdate(
                { student: student._id, status: "pending" },
                { status: "paid" }
            );
            console.log("✅ Invoice updated to PAID");
        }
    }

    res.status(200).send("Webhook received.");
};
