const { validationResult } = require('express-validator');
const { Maintenance, Student } = require('../models');
const { verifyToken } = require('../utils/auth');
const Notification = require("../models/Notification");

// @route   request api/maintenance/request
// @desc    Request for mess off
// @access  Public
exports.requestMaintenance = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ "message": errors.array(), success });
    }

    const { student, leaving_date, return_date } = req.body;
    const today = new Date();

    // ✅ Validate Dates
    if (new Date(leaving_date) > new Date(return_date)) {
        return res.status(400).json({ success, "message": "Leaving date cannot be greater than return date" });
    } else if (new Date(leaving_date) < today) {
        return res.status(400).json({ success, "message": "Request cannot be made for past Mess off" });
    }

    try {
        // ✅ Save mess off request in database
        const maintenance = new Maintenance({ student, leaving_date, return_date });
        await maintenance.save();

        // ✅ Notify Admin
        const admin = await Admin.findOne(); // Assuming there is one admin
        if (admin) {
            await Notification.create({
                recipient: admin._id,
                role: "Admin",
                message: "A student has requested a mess off.",
            });
        }

        success = true;
        return res.status(200).json({ success, "message": "Maintenance request sent successfully" });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ success, "message": "Server Error" });
    }
};


// @route   GET count of request api/maintenance/count
// @desc    Get all mess off requests
// @access  Private
exports.countMaintenance = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array(), success});
    }
    const { student } = req.body;
    try {
        let date = new Date();
        const list = await Maintenance.find({ student, leaving_date: { $gte: new Date(date.getFullYear(), date.getMonth(), 1), $lte: new Date(date.getFullYear(), date.getMonth() + 1, 0) } });
        let approved = await Maintenance.find({student, status: "Approved", leaving_date: {$gte: new Date(date.getFullYear(), date.getMonth(), 1), $lte: new Date(date.getFullYear(), date.getMonth()+1, 0)}});
        
        let days = 0;
        for (let i = 0; i < approved.length; i++) {
            days += (new Date(approved[i].return_date) - new Date(approved[i].leaving_date))/(1000*60*60*24);
        }

        approved = days;

        success = true;
        return res.status(200).json({success, list, approved});
    }
    catch (err) {
        console.error(err.message);
        return res.status(500).json({success, "message": "Server Error"});
    }
}

// @route   GET api/maintenance/list
// @desc    Get all mess off requests
// @access  Public
exports.listMaintenance = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array(), success});
    }
    const { hostel } = req.body;
    try {
        const students = await Student.find({ hostel }).select('_id');
        const list = await Maintenance.find({ student: { $in: students } , status: "pending" }).populate('student', ['name', 'room_no']);
        const approved = await Maintenance.countDocuments({ student: { $in: students }, status: "approved", leaving_date: {$gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), $lte: new Date(new Date().getFullYear(), new Date().getMonth()+1, 0)}});
        const rejected = await Maintenance.countDocuments({ student: { $in: students }, status: "rejected", leaving_date: {$gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), $lte: new Date(new Date().getFullYear(), new Date().getMonth()+1, 0)}});
        success = true;
        return res.status(200).json({success, list, approved, rejected});
    }
    catch (err) {
        // console.error(err.message);
        return res.status(500).json({success, errors: [{msg: "Server Error"}]});
    }
}

// @route   GET api/maintenance/update
// @desc    Update mess off request
// @access  Public
exports.updateMaintenance = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array(), success});
    }
    const { id, status } = req.body;
    try {
        const maintenance = await Maintenance.findByIdAndUpdate(id, { status });
        success = true;
        return res.status(200).json({success, maintenance});
    }
    catch (err) {
        console.error(err.message);
        return res.status(500).json({success, errors: [{msg: "Server Error"}]});
    }
}