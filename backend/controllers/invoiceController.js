
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { check, validationResult } = require('express-validator');
const { Invoice, Maintenance, Student } = require('../models');
const { Mess_bill_per_day } = require('../constants/mess');
// const sendEmail = require("../utils/emailService");
const nodemailer = require("nodemailer");
const Payment = require("../models/Payment");
const bcrypt = require('bcryptjs');
const Parser = require('json2csv').Parser;

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

        // Find existing payment first (DO NOT upsert here)
        let payment = await Payment.findOne({ stripeSessionId: session_id }).populate("student invoice");

        if (!payment) {
            console.log("⚠️ Payment not found in DB. Creating new record...");
            const studentId = session.metadata?.studentId; // Use optional chaining

            if (!studentId) {
                return res.status(400).json({ success: false, message: "Student ID missing from Stripe session." });
            }

            const invoice = await Invoice.findOne({ student: studentId, status: "pending" });
            if (!invoice) {
                return res.status(400).json({ success: false, message: "Invoice not found." });
            }

            // ✅ Create a new Payment entry
            payment = new Payment({
                student: invoice.student,
                invoice: invoice._id,
                amount: session.amount_total / 100,
                stripeSessionId: session_id,
                paymentMethod: "Stripe",
                paymentStatus: "Completed"
            });

            await payment.save();
        } else {
            // ✅ Update existing payment record
            payment.paymentStatus = "Completed";
            await payment.save();
        }

        // ✅ Ensure Invoice is marked as Paid
        const invoice = await Invoice.findByIdAndUpdate(
            payment.invoice,
            { status: "paid" },
            { new: true }
        );

        if (!invoice) {
            return res.status(400).json({ success: false, message: "Invoice update failed." });
        }

        console.log("✅ Payment and Invoice updated successfully.");
        res.status(200).json({ success: true, message: "Payment confirmed!", invoice });


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

    const { student } = req.body;  // ✅ student is correctly received
    try {
        const invoices = await Invoice.find({ student });

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
    try {
        const { hostel } = req.body;
        const students = await Student.find({ hostel });
        const invoices = await Invoice.find({
            student: { $in: students },
            date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        });

        if (invoices.length === students.length) {
            return res.status(400).json({ errors: 'Invoices already generated', success });
        }

        // Get days in the previous month
        let daysinlastmonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).getDate();
        let amount = Mess_bill_per_day * daysinlastmonth;
        let count = 0;

        for (const student of students) {
            let messoff = await Maintenance.find({ student: student });

            if (messoff.length > 0) {
                messoff.forEach((messoffone) => {
                    if (messoffone.status === 'approved' && messoffone.return_date.getMonth() + 1 === new Date().getMonth()) {
                        let leaving_date = messoffone.leaving_date;
                        let return_date = messoffone.return_date;
                        let number_of_days = (return_date - leaving_date) / (1000 * 60 * 60 * 24);
                        amount -= Mess_bill_per_day * number_of_days;
                    }
                });
            }

            try {
                // Get current month and year
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const currentMonth = monthNames[new Date().getMonth()]; // Get month name
                const currentYear = new Date().getFullYear(); // Get year

                let invoice = new Invoice({
                    student,
                    amount,
                    title: `Hostel Fees - ${currentMonth} ${currentYear}` // Set the correct title format
                });

                await invoice.save();
                count++;
            } catch (err) {
                console.error("Invoice creation error for student:", student._id, err.message);
                return res.status(500).json({ success: false, message: 'Server error while generating invoices' });
            }
        }

        success = true;
        return res.status(200).json({ success, count });

    } catch (error) {
        console.error("Error generating invoices:", error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};




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
    const { student } = req.body;
    if (!student) {
        return res.status(400).json({ success: false, message: "Student ID is required" });
    }

    try {
        let invoices = await Invoice.find({ student });
        success = true;
        res.status(200).json({ success: true, invoices });
    }
    catch (error) {
        console.error(error.message);
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

exports.csvInvoice = async (req, res) => {
    let success = false;
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success, errors: errors.array() });
        }

        const { student } = req.body;
        const invoices = await Invoice.find({ student: student._id });

        // Get current month and year
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonth = monthNames[new Date().getMonth()];
        const currentYear = new Date().getFullYear();

        // Ensure invoices contain student data
        const formattedInvoices = invoices.map(invoice => ({
            name: student.name,
            cms_id: student.cms_id,
            room_no: student.room_no,
            batch: student.batch,
            dept: student.dept,
            course: student.course,
            email: student.email,
            father_name: student.father_name,
            address: student.address,
            d_o_b: student.d_o_b,
            title: `Hostel Fees - ${currentMonth} ${currentYear}`,
            date: new Date().toDateString().slice(4),
            amount: 8400
        }));

        const fields = ['name', 'cms_id', 'room_no', 'batch', 'dept', 'course', 'email', 'father_name', 'address', 'd_o_b', 'title', 'date', 'amount'];
        const opts = { fields };

        const parser = new Parser(opts);
        const csv = parser.parse(formattedInvoices);

        success = true;
        res.json({ success, csv });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success, errors: [{ msg: 'Server error' }] });
    }
};
