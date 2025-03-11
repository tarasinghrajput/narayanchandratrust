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
        const { studentId, paymentType } = req.body;

        // ✅ Add validation for paymentType
        if (!["monthly", "annual"].includes(paymentType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment type"
            });
        }

        const student = await Student.findById(studentId);
        const invoice = await Invoice.findOne({
            student: studentId,
            status: "pending"
        });

        // ✅ Add null checks
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "No pending invoice found"
            });
        }

        // ✅ Fix installment calculation
        const calculateAmount = (baseAmount, type) => {
            if (type === "annual") return baseAmount * 12 * 0.9;
            return baseAmount;
        };

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [{
                price_data: {
                    currency: "inr",
                    product_data: { name: `Hostel Fees - ${paymentType}` },
                    unit_amount: invoice.amount * (paymentType === "annual" ? 12 : 1) * 100,
                    recurring: {
                        interval: paymentType === "annual" ? "year" : "month"
                    },
                },
                quantity: 1,
            }],
            mode: "subscription",
            billing_address_collection: "required",
            shipping_address_collection: { allowed_countries: ["IN"] },
            metadata: {
                studentId: studentId,
                paymentType: paymentType,
                invoiceId: invoice._id.toString()
            },
            success_url: `http://localhost:5173/student-dashboard/invoices?success=true?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:5173/student-dashboard/invoices?canceled=true`
        });


        // ✅ Fix installment configuration
        if (paymentType === "installment") {
            sessionConfig.subscription_data = {
                billing_cycle_anchor: Math.floor(Date.now() / 1000) + 86400, // Start tomorrow
                collection_method: "charge_automatically",
                installment_plan: {
                    interval: "month",
                    intervals: 3
                }
            };
        }

        res.json({ success: true, sessionUrl: session.url });

    } catch (error) {
        console.error("Payment Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Payment setup failed" // ✅ Show actual error
        });
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
    try {
      const sig = req.headers["stripe-signature"];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
      let event;
  
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.error("⚠️ Webhook signature verification failed.", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
  
      // Only listen to successful payment events
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
  
        const studentId = session.metadata.studentId;
        const paymentId = session.metadata.paymentId;
        const amount = session.amount_total / 100; // Convert cents to rupees
  
        // Fetch and update payment status
        const payment = await Payment.findById(paymentId);
        if (!payment) {
          console.error("Payment record not found in database");
          return res.status(404).send("Payment not found");
        }
        payment.paymentStatus = "Completed";
        await payment.save();
  
        // Create an invoice entry
        const invoice = new Invoice({
          student: studentId,
          payment: paymentId,
          amountPaid: amount,
          paymentType: session.payment_method_types[0],
          status: "Paid",
          invoiceDate: new Date(),
          stripeSessionId: session.id,
        });
  
        await invoice.save();
        console.log("✅ Invoice successfully created:", invoice);
      }
  
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("❌ Error processing webhook:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
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

