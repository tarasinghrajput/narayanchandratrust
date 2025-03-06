const { validationResult } = require('express-validator');
const { Invoice, Maintenance, Student } = require('../models');
const { Mess_bill_per_day } = require('../constants/mess');
const sendEmail = require("../utils/emailService");

exports.confirmPayment = async (req, res) => {
    const { session_id } = req.query;
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
        const invoice = await Invoice.findOneAndUpdate(
            { payment_id: session_id },
            { status: "paid" },
            { new: true }
        );

        // ✅ Send email confirmation
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: invoice.student.email,
            subject: "Payment Confirmation",
            text: `Your hostel fees for ${invoice.title} has been paid.`
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: "admin@hostel.com",
            subject: "New Payment Received",
            text: `${invoice.student.name} has paid ${invoice.amount}.`
        });

        res.status(200).json({ success: true, message: "Payment confirmed!" });
    } else {
        res.status(400).json({ success: false, message: "Payment not completed." });
    }
};





// @route   Generate api/invoice/generate
// @desc    Generate invoice
// @access  Public
exports.generateInvoices = async (req, res) => {
    let success = false;
    const { hostel } = req.body;
    const students = await Student.find({ hostel });
    
    let daysInLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).getDate();
    let amount = Mess_bill_per_day * daysInLastMonth;

    for (let student of students) {
        const existingInvoice = await Invoice.findOne({
            student: student._id,
            date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        });

        if (existingInvoice) continue; // Skip if invoice already exists

        let invoice = new Invoice({
            student: student._id,
            title: `Hostel Fees - ${new Date().toLocaleString("default", { month: "long", year: "numeric" })}`,
            amount,
            status: "pending",
            date: new Date()
        });

        await invoice.save();
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
    const { student } = req.body;
    try {
        let invoices = await Invoice.find({ student: student });
        success = true;
        res.status(200).json({ success, invoices });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
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
