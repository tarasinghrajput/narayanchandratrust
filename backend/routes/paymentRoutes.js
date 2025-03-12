const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { createSession } = require("../controllers/paymentController");
// const { handleStripeWebhook } = require("../controllers/paymentController");
const { stripeWebhook } = require("../controllers/paymentController");
const { getPaymentsByStudent } = require("../controllers/paymentController");
const { storePayment } = require("../controllers/paymentController");
const { generateInvoice } = require("../controllers/paymentController");

router.post("/create-session", createSession);
// router.post("/stripe-webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

router.post("/student", [
    check("student", "Student ID is required").not().isEmpty(),
], getPaymentsByStudent);

router.post("/store-payment", storePayment);

router.post("/generate-invoice", generateInvoice)

module.exports = router;