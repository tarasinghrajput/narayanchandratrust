const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// Route to fetch notifications for a user
router.get("/:role/:id", async (req, res) => {
  try {
    const { role, id } = req.params;
    const notifications = await Notification.find({ recipient: id, role }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// This Route is to add a notification
router.post("/add", async (req, res) => {
  try {
    const { recipient, role, message } = req.body;

    const notification = new Notification({ recipient, role, message });
    await notification.save();

    res.status(201).json({ success: true, notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;