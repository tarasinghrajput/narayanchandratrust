const express = require('express')
const router = express.Router()
const { check } = require('express-validator')
const { generateInvoices, getInvoicesbyid, getInvoices, updateInvoice } = require('../controllers/invoiceController')
const { confirmPayment, csvInvoice } = require("../controllers/invoiceController");

// @route   GET api/invoice/student
// @desc    Get all invoices
// @access  Public
// router.get('/student', (req, res) => {
//     res.status(400).json({ success: false, message: "Use POST request with student ID" });
// });

router.get("/confirm-payment", confirmPayment);

// router.post("/student", [
//     check("student", "Student ID is required").not().isEmpty(),
// ], getInvoicesByStudent);

router.post('/student', [
    check('student', 'Student is required').not().isEmpty()
], getInvoices);


// @route   Generate api/invoice/generate
// @desc    Generate invoice
// @access  Public
router.post('/generate', [
    check('hostel', 'Hostel is required').not().isEmpty(),
], generateInvoices);

// @route   POST api/invoice/getbyid
// @desc    Get all invoices
// @access  Public
router.post('/getbyid', [
    check('hostel', 'Hostel ID is required').not().isEmpty()
], getInvoicesbyid);
// @route   GET api/invoice/update
// @desc    Update invoice
// @access  Public 
router.post('/update', [
    check('student', 'Student is required').not().isEmpty(),
    check('status', 'Status is required').not().isEmpty()
], updateInvoice);

// @route  POST api/invoice/csv
// @desc   Get CSV of students
// @access Public
router.post('/csv', [
    check('student', 'StudentID is required').not().isEmpty()
], csvInvoice);

module.exports = router;