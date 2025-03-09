const router = require('express').Router();
const Rooms = require('../models/Rooms');
const Student = require('../models/Student');
const Invoice = require('../models/Invoice');
const Payments = require('../models/Payments');
// const { verifySession, isAdmin } = require('../utils/auth');

// Occupancy Summary
router.get('/occupancy', async (req, res) => {
    try {
        const rooms = await Rooms.find().populate('currentOccupants');
        const totalRooms = 35; // Fixed as per your requirement

        const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
        const totalStudents = rooms.reduce((sum, room) => sum + room.currentOccupants.length, 0);
        const availableBeds = (totalRooms * 2) - totalStudents;

        res.json({
            totalRooms,
            occupiedRooms,
            vacantRooms: totalRooms - occupiedRooms,
            occupancyRate: ((occupiedRooms / totalRooms) * 100).toFixed(2),
            totalStudents,
            availableBeds: availableBeds > 0 ? availableBeds : 0
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Room-wise Occupancy Details
router.get('/room-details', async (req, res) => {
    try {
        const rooms = await Rooms.find()
            .populate('currentOccupants')
            .sort({ roomNumber: 1 });

        const roomDetails = rooms.map(room => ({
            roomNumber: room.roomNumber,
            status: room.status,
            occupants: room.currentOccupants.map(s => s.name),
            availableBeds: room.capacity - room.currentOccupants.length
        }));

        res.json(roomDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Additional Report: Department-wise Occupancy
router.get('/department-wise', async (req, res) => {
    try {
        const students = await Student.aggregate([
            {
                $group: {
                    _id: "$dept",
                    count: { $sum: 1 },
                    students: { $push: "$name" }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Monthly Payment Collections
router.get('/monthly-collections', async (req, res) => {
    try {
        const results = await Payments.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        res.json(results.map(item => ({
            month: `${item._id.month}/${item._id.year}`,
            total: item.total,
            count: item.count
        })));

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pending Invoices (>30 days overdue)
router.get('/overdue-invoices', async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const invoices = await Invoice.find({
            status: 'pending',
            date: { $lt: thirtyDaysAgo }
        }).populate('student');

        res.json(invoices);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Revenue Breakdown
router.get('/revenue-breakdown', async (req, res) => {
    try {
        const breakdown = await Invoice.aggregate([
            {
                $match: { status: 'paid' }
            },
            {
                $group: {
                    _id: "$title",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json(breakdown);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Student-wise Payment History
router.get('/student-payments/:studentId', async (req, res) => {
    try {
        const payments = await Payments.find({
            student: req.params.studentId
        })
            .populate('invoice')
            .sort({ date: -1 });

        res.json(payments);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Filtered Revenue Report
router.get('/filtered-revenue', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const matchStage = {
            status: 'paid'
        };

        if (startDate && endDate) {
            matchStage.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const revenueData = await Invoice.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    month: {
                        $concat: [
                            { $toString: "$_id.year" },
                            "-",
                            { $toString: "$_id.month" }
                        ]
                    },
                    total: 1,
                    count: 1,
                    _id: 0
                }
            },
            { $sort: { month: 1 } }
        ]);

        res.json(revenueData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




module.exports = router;