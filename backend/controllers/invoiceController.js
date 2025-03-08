
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
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     return res.status(400).json({ errors: errors.array(), success });
    // }
    const { hostel } = req.body;
    const students = await Student.find({ hostel })
    const invoices = await Invoice.find({ student: { $in: students }, date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } })
    if (invoices.length === students.length) {
        return res.status(400).json({ errors: 'Invoices already generated', success });
    }

    // get days in previous month
    let daysinlastmonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).getDate();

    let amount = Mess_bill_per_day * daysinlastmonth;
    count = 0;
    students.map(async (student) => {
        let messoff = await Maintenance.find({ student: student });
        if (messoff) {
            messoff.map((messoffone) => {
                if (messoffone.status === 'approved' && messoffone.return_date.getMonth() + 1 === new Date().getMonth()) {
                    let leaving_date = messoffone.leaving_date;
                    let return_date = messoffone.return_date;
                    let number_of_days = (return_date - leaving_date) / (1000 * 60 * 60 * 24);
                    amount -= Mess_bill_per_day * number_of_days;
                }
            });
        }

        try {
            let invoice = new Invoice({
                student,
                amount
            });
            await invoice.save();
            count++;
        }
        catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    });
    success = true;
    res.status(200).json({ success, count });
}



// @route   GET api/invoice/getbyid
// @desc    Get all invoices
// @access  Public
exports.getInvoicesbyid = async (req, res) => {
    let success = false;
    try {
        const { hostel } = req.body;
        if (!hostel || !hostel._id) {
            return res.status(400).json({ success, error: "Hostel ID is required" });
        }

        // Find all students belonging to the hostel
        let students = await Student.find({ hostel: hostel._id }).select('_id');
        if (!students.length) {
            return res.status(404).json({ success, error: "No students found for this hostel" });
        }

        // Extract student IDs
        const studentIds = students.map(student => student._id);

        // Fetch invoices for these students
        let invoices = await Invoice.find({ student: { $in: studentIds } })
            .populate('student', ['_id', 'name', 'room_no', 'cms_id']);

        success = true;
        res.status(200).json({ success, invoices });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: "Server error" });
    }
};


// @route   POST api/invoice/student
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
