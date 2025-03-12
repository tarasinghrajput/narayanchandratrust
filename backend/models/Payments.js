const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "student", required: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "invoice", required: true },
    amount: { type: Number, required: true },
    dueAmount: { type:Number, default: 8400 },
    paymentMethod: { type: String, default: "Stripe" },
    paymentId: { type: String },
    paymentStatus: { type: String, default: "Pending" }, // ✅ Default should be "Pending" until confirmed
    stripeSessionId: { type: String, required: true }, // ✅ Store Stripe session ID
    date: { type: Date, default: Date.now },
});

module.exports = Payments = mongoose.model("payments", PaymentSchema);