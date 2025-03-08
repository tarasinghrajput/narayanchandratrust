const router = require('express').Router();
const Room = require('../models/Room');
const { verifySession, isAdmin } = require('../utils/auth');
// Get all rooms (Admin only)
router.get('/', verifySession, isAdmin, async (req, res) => {
  try {
    const rooms = await Room.find().populate('students');
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new room (Admin only)
router.post('/', verifySession, isAdmin, async (req, res) => {
  try {
    const newRoom = new Room(req.body);
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;