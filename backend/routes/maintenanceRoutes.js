const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { requestMaintenance, countMaintenance, listMaintenance, updateMaintenance } = require('../controllers/maintenanceController');

// @route   request api/maintenance/request
// @desc    Request for mess off
// @access  Public
router.post('/request', [
    check('student', 'Student ID is required').not().isEmpty(),
    check('leaving_date', 'Leaving date is required').not().isEmpty(),
    check('return_date', 'Return date is required').not().isEmpty()
], requestMaintenance);

// @route   GET count of request api/maintenance/count
// @desc    Get all mess off requests
// @access  Private
router.post('/count', [
    check('student', 'Student ID is required').not().isEmpty()
], countMaintenance);

// @route   GET list of request api/maintenance/list
// @desc    Get all mess off requests
// @access  Public
router.post('/list', [
    check('hostel', 'Hostel is required').not().isEmpty()
], listMaintenance);

// @route   POST update request api/maintenance/update
// @desc    Update mess off request
// @access  Public
router.post('/update', [
    check('id', 'ID is required').not().isEmpty(),
    check('status', 'Status is required').not().isEmpty()
], updateMaintenance);

module.exports = router;