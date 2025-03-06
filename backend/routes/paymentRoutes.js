const express = require("express");
const router = express.Router();
const { createSession } = require("../controllers/paymentController");
const { handleStripeWebhook } = require("../controllers/paymentController");

router.post("/create-session", createSession);
router.post("/stripe-webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

module.exports = router;