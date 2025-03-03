const express = require('express');
const router = express.Router();
const Hostel = require('../models/Hostel');

// GET /api/hostel → Fetch hostel details
router.get('/', async (req, res) => {
    try {
        const hostel = await Hostel.findOne(); // Fetch first hostel document
        if (!hostel) {
            return res.status(404).json({ success: false, message: "Hostel not found" });
        }
        res.status(200).json({ success: true, hostel });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
