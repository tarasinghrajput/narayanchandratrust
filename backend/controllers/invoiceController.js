
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { check, validationResult } = require('express-validator');
const { Invoice, Maintenance, Student } = require('../models');
const { Mess_bill_per_day } = require('../constants/mess');
// const sendEmail = require("../utils/emailService");
const nodemailer = require("nodemailer");
const Payment = require("../models/Payment");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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



exports.pdfInvoice = async (req, res) => {
    let success = false;
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success, errors: errors.array() });
        }

        const { student } = req.body;
        const invoices = await Invoice.find({ student: student._id });

        if (!invoices.length) {
            return res.status(404).json({ success, errors: [{ msg: "No invoices found" }] });
        }

        // Get current month and year
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonth = monthNames[new Date().getMonth()];
        const currentYear = new Date().getFullYear();

        // Ensure invoices directory exists
        const invoicesDir = path.join(__dirname, "../invoices");
        if (!fs.existsSync(invoicesDir)) {
            console.log("Creating invoices directory...");
            fs.mkdirSync(invoicesDir, { recursive: true });
        }

        // Define PDF file path
        const pdfPath = path.join(invoicesDir, `invoice_${student._id}.pdf`);
        console.log("Attempting to write PDF to:", pdfPath);

        // Create and write PDF
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(pdfPath);

        // Pipe document to the stream
        doc.pipe(writeStream);

        // Add Title
        doc.fontSize(20).text(`Invoice - ${currentMonth} ${currentYear}`, { align: "center" }).moveDown(2);

        // Student Information
        doc.fontSize(14).text(`Name: ${student.name}`);
        doc.text(`CMS ID: ${student.cms_id}`);
        doc.text(`Room No: ${student.room_no}`);
        doc.text(`Batch: ${student.batch}`);
        doc.text(`Department: ${student.dept}`);
        doc.text(`Course: ${student.course}`);
        doc.text(`Email: ${student.email}`);
        doc.text(`Father's Name: ${student.father_name}`);
        doc.text(`Address: ${student.address}`);
        doc.text(`Date of Birth: ${student.dob}`).moveDown(2);

        // Invoice Details
        doc.fontSize(16).text(`Invoice Details:`, { underline: true }).moveDown();
        invoices.forEach((invoice, index) => {
            doc.fontSize(14).text(`${index + 1}. ${invoice.title}`);
            doc.text(`Date: ${new Date(invoice.date).toDateString()}`);
            doc.text(`Amount: ₹${invoice.amount}`);
            doc.text(`Status: ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}`).moveDown();
        });

        // Finalize and close PDF document
        doc.end();

        // Handle PDF write completion
        writeStream.on("finish", () => {
            console.log("PDF successfully written:", pdfPath);
            success = true;
            res.download(pdfPath, `invoice_${student._id}.pdf`);
        });

        // Handle any write errors
        writeStream.on("error", (err) => {
            console.error("Error writing PDF file:", err);
            return res.status(500).json({ success, errors: [{ msg: "Error writing PDF file" }] });
        });

    } catch (err) {
        console.error("Error occurred while creating PDF:", err);
        res.status(500).json({ success, errors: [{ msg: "Server error" }] });
    }
};

