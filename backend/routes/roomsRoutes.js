const express = require('express');
const router = express.Router();
const Rooms = require("../models/Rooms");

// GET all rooms
router.get('/', async (req, res) => {
    const { sortBy, page = 1, limit = 35 } = req.query;

    const sortOptions = {
        roomNumber: { roomNumber: 1 }, // Sort by room number ascending
        occupancy: { currentOccupants: -1 } // Sort by number of occupants descending
    };

    const sortQuery = sortOptions[sortBy] || { roomNumber: 1 };

    try {
        const rooms = await Rooms.find()
            .sort(sortQuery)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('currentOccupants', 'name'); // Only fetch the student's name
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



module.exports = router;