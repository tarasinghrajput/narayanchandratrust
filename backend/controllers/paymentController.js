const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { Invoice, Student } = require("../models");
const nodemailer = require("nodemailer");

exports.createPaymentSession = async (req, res) => {
    const { studentId, invoiceId } = req.body;
    
    const student = await Student.findById(studentId);
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice || invoice.status === "paid") {
        return res.status(400).json({ success: false, message: "Invoice already paid or not found." });
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
            price_data: {
                currency: "usd",
                product_data: { name: invoice.title },
                unit_amount: invoice.amount * 100
            },
            quantity: 1,
        }],
        mode: "payment",
        success_url: `http://localhost:5173/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://localhost:5173/invoices`
    });

    res.json({ success: true, url: session.url });
};