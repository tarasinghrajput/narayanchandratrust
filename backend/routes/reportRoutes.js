const router = require('express').Router();
const Rooms = require('../models/Rooms');
const Student = require('../models/Student');
const Invoice = require('../models/Invoice');
const Payments = require('../models/Payments');
const Complaint = require('../models/Complaint');
const Maintenance = require('../models/Maintenance');
const Suggestion = require('../models/Suggestion');
// const { verifySession, isAdmin } = require('../utils/auth');

// Occupancy Summary
router.get('/occupancy', async (req, res) => {
    try {
        const rooms = await Rooms.find().populate('currentOccupants');
        if (!rooms) throw new Error("No rooms found");

        const totalRooms = 35;
        const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
        const totalStudents = rooms.reduce((sum, room) => sum + (room.currentOccupants ? room.currentOccupants.length : 0), 0);
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
        console.error("Error in /occupancy:", error); // Log the error
        res.status(500).json({ error: error.message });
    }
});


// Room-wise Occupancy Details
router.get('/room-details', async (req, res) => {
    try {
        const rooms = await Rooms.find().populate('currentOccupants').sort({ roomNumber: 1 });

        if (!rooms) throw new Error("No rooms found");

        const roomDetails = rooms.map(room => ({
            roomNumber: room.roomNumber,
            status: room.status || "unknown",
            occupants: Array.isArray(room.currentOccupants) ? room.currentOccupants.map(s => s.name) : [],
            availableBeds: room.capacity - (Array.isArray(room.currentOccupants) ? room.currentOccupants.length : 0)
        }));

        res.json(roomDetails);
    } catch (error) {
        console.error("Error in /room-details:", error);
        res.status(500).json({ error: error.message });
    }
});


// Additional Report: Department-wise Occupancy
// Updated aggregation in your backend API
router.get('/department-wise', async (req, res) => {
    try {
        const students = await Student.aggregate([
            {
                $group: {
                    _id: "$dept",
                    count: { $sum: 1 },
                    students: { 
                        $push: {
                            name: "$name",
                            cms_id: "$cms_id",
                            batch: "$batch",
                            room_no: "$room_no",
                            email: "$email",
                            contact: "$contact"
                        }
                    }
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
        }).populate('invoice')
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


// Complaint Statistics
router.get('/complaint-stats', async (req, res) => {
    try {
        const stats = await Complaint.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    avgResolution: {
                        $avg: {
                            $cond: [
                                { $eq: ["$status", "resolved"] },
                                { $subtract: [new Date(), "$date"] },
                                null
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    status: "$_id",
                    count: 1,
                    avgResolutionHours: { $divide: ["$avgResolution", 1000 * 60 * 60] },
                    _id: 0
                }
            }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Frequent Complaint Types
router.get('/common-complaints', async (req, res) => {
    try {
        const types = await Complaint.aggregate([
            { $group: { _id: "$type", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Maintenance Status
router.get('/maintenance-status', async (req, res) => {
    try {
        const status = await Maintenance.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pending Suggestions
router.get('/pending-suggestions', async (req, res) => {
    try {
        const suggestions = await Suggestion.find({ status: "pending" })
            .populate('student')
            .sort({ date: -1 });
        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;