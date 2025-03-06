const express = require("express");
const router = express.Router();
const { createPaymentSession } = require("../controllers/paymentController");

router.post("/create-session", createPaymentSession);

module.exports = router;