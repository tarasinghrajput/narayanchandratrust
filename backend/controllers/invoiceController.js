const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { check, validationResult } = require('express-validator');
const { Invoice, Maintenance, Student } = require('../models');
const { Mess_bill_per_day } = require('../constants/mess');
// const sendEmail = require("../utils/emailService");
const nodemailer = require("nodemailer");
const Payment = require("../models/Payment");

exports.confirmPayment = async (req, res) => {
    const { session_id } = req.query;
    if (!session_id) {
        return res.status(400).json({ success: false, message: "Session ID is required." });
    }

    try {
        // ✅ Retrieve Stripe session
        const session = await stripe.checkout.sessions.retrieve(session_id);
        console.log("🔍 Stripe Session Retrieved:", session);

        if (session.payment_status !== "paid") {
            return res.status(400).json({ success: false, message: "Payment not completed." });
        }

        // ✅ Step 1: Find the Payment record linked to this session
        let payment = await Payment.findOneAndUpdate(
            { stripeSessionId: session_id },
            { paymentStatus: "Completed" },
            { new: true }
        ).populate("student invoice"); // ✅ Fetch Student & Invoice Data

        if (!payment) {
            console.log("⚠️ Payment not found in DB. Creating new record...");
            const studentId = session.metadata.studentId; // Ensure session has studentId
            const invoice = await Invoice.findOne({ student: studentId, status: "pending" });

            if (!invoice) {
                return res.status(400).json({ success: false, message: "Invoice not found." });
            }

            // ✅ Create a new payment entry if it doesn’t exist
            payment = new Payment({
                student: invoice.student,
                invoice: invoice._id,
                amount: invoice.amount,
                stripeSessionId: session_id,
                paymentMethod: "Stripe",
                paymentStatus: "Completed"
            });

            await payment.save();
        }

        // ✅ Step 2: Find and update the Invoice status to "paid"
        const invoice = await Invoice.findOneAndUpdate(
            { _id: payment.invoice },
            { status: "paid" },
            { new: true }
        );

        if (!invoice) {
            return res.status(400).json({ success: false, message: "Invoice not found." });
        }

        console.log("✅ Invoice updated:", invoice);

        res.status(200).json({ success: true, message: "Payment confirmed, invoice updated!", invoice });

    } catch (error) {
        console.error("❌ Error confirming payment:", error);
        res.status(500).json({ success: false, message: "Server error while confirming payment" });
    }
};




exports.getInvoicesByStudent = async (req, res) => {
    let success = false;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    const { studentId } = req.body;
    try {
        console.log("📩 Fetching invoices for student ID:", studentId);
        const invoices = await Invoice.find({ student: studentId });

        success = true;
        res.status(200).json({ success, invoices });
    } catch (error) {
        console.error("❌ Error fetching invoices:", error);
        res.status(500).json({ success: false, message: "Server error while fetching invoices" });
    }
};


// @route   Generate api/invoice/generate
// @desc    Generate invoice
// @access  Public
exports.generateInvoices = async (req, res) => {
    let success = false;
    const { hostel } = req.body;
    if (!hostel) {
        return res.status(400).json({ success: false, message: "Hostel is required!" });
    }
    
    const students = await Student.find({ hostel });
    if (students.length === 0) {
        return res.status(400).json({ success: false, message: "No students found for this hostel." });
    }

    let daysInLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).getDate();
    let amount = Mess_bill_per_day * daysInLastMonth;

    for (let student of students) {

        const existingInvoice = await Invoice.findOne({
            student: student._id,
            date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        });

        if (existingInvoice) {
            console.log(`⚠️ Invoice already exists for student: ${student._id}, skipping.`);
            continue; // Skip if invoice already exists
        }

        let invoice = new Invoice({
            student: student._id,
            title: `Hostel Fees - ${new Date().toLocaleString("default", { month: "long", year: "numeric" })}`,
            amount,
            status: "pending",
            date: new Date()
        });

        try {
            await invoice.save();
            console.log(`✅ Invoice saved for student: ${student._id}`);
        } catch (error) {
            console.error(`❌ Error saving invoice for student ${student._id}:`, error);
        }
    }

    success = true;
    res.status(200).json({ success, message: "Invoices generated!" });
};



// @route   GET api/invoice/getbyid
// @desc    Get all invoices
// @access  Public
exports.getInvoicesbyid = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), success });
    }
    const { hostel } = req.body;
    let student = await Student.find({ hostel: hostel });
    try {
        let invoices = await Invoice.find({ student: student }).populate('student', ['name', 'room_no', 'cms_id']);
        success = true;
        res.status(200).json({ success, invoices });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
}

// @route   GET api/invoice/student
// @desc    Get all invoices
// @access  Public
exports.getInvoices = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), success });
    }
    const { studentId } = req.body;
    if (!studentId) {
        return res.status(400).json({ success: false, message: "Student ID is required" });
    }

    try {
        let invoices = await Invoice.find({ student: studentId });
        success = true;
        res.status(200).json({ success: true, invoices });
    }
    catch (error) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// @route   GET api/invoice/update
// @desc    Update invoice
// @access  Public
exports.updateInvoice = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), success });
    }
    const { student, status } = req.body;
    try {
        let invoice = await Invoice.findOneAndUpdate(
            { student: student, date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }, 
            { status: status },
            { new: true }  // ✅ Ensures updated invoice is returned
        );
        success = true;
        res.status(200).json({ success, invoice });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
}
