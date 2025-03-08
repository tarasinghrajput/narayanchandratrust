const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: "Stripe" },
    paymentStatus: { type: String, default: "Pending" }, // ✅ Default should be "Pending" until confirmed
    stripeSessionId: { type: String, required: true }, // ✅ Store Stripe session ID
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", PaymentSchema);