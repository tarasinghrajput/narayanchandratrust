const { validationResult } = require('express-validator');
const { Invoice, Maintenance } = require('../models');
const { Mess_bill_per_day } = require('../constants/mess');
const sendEmail = require("../utils/emailService");
const Student = require('../models/Student'); 

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
    try {
        let invoices = await Invoice.find({ studentId });
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
