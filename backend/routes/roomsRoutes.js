const express = require('express');
const router = express.Router();
const Rooms = require("../models/Rooms");

// GET all rooms
router.get('/', async (req, res) => {
    const { sortBy, page = 1, limit = 10 } = req.query;

    const sortOptions = {
        roomNumber: 'roomNumber',
        occupancy: '-currentOccupants.length'
      };
    try {
        const rooms = await Rooms.find()
        .sort(sortOptions[sortBy] || 'roomNumber')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate({
            path: 'currentOccupants',
            model: 'student' // Match your Student model name
        });
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



module.exports = router;