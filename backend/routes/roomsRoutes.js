const express = require('express');
const router = express.Router();
const Rooms = require("../models/Rooms");
const Student = require("../models/Student");

// GET all rooms
router.get('/', async (req, res) => {
    try {
        const rooms = await Rooms.find()
            .populate({
                path: 'currentOccupants',
                model: 'student' // Match your Student model name
            });
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// POST get batch students
router.post('/students/batch', async (req, res) => {
    try {
        if (!req.body.ids) {
            return res.status(400).json({ message: "Missing student IDs" });
        }

        const students = await Student.find({
            '_id': { $in: req.body.ids }
        });

        if (!students.length) {
            return res.status(404).json({ message: "No students found" });
        }

        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;