const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomNumber: {
        type: String,
        required: true,
        unique: true
    },
    capacity: {
        type: Number,
        default: 2
    },
    currentOccupants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student'
    }],
    status: {
        type: String,
        enum: ['available', 'occupied'],
        default: 'available'
    }
});

const Rooms = mongoose.model("rooms", roomSchema);
module.exports = Rooms;