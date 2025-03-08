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

// Auto-update status on save
roomSchema.pre('save', function (next) {
    this.status = this.currentOccupants.length >= this.capacity ? 'occupied' : 'available';
    next();
});

// Auto-update status on findOneAndUpdate or findByIdAndUpdate
roomSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
    if (update.currentOccupants) {
        const newOccupants = update.currentOccupants;
        const room = await this.model.findOne(this.getQuery());
        const totalOccupants = newOccupants.length || room.currentOccupants.length;

        update.status = totalOccupants >= room.capacity ? 'occupied' : 'available';
    }
    next();
});

const Rooms = mongoose.model("rooms", roomSchema);
module.exports = Rooms;