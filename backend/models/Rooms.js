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
        const room = await this.model.findOne(this.getQuery());
        const newOccupants = update.currentOccupants.length || room.currentOccupants.length;
        this.set({ status: newOccupants >= room.capacity ? 'occupied' : 'available' });
    }
    next();
});


module.exports = Rooms = mongoose.models.rooms || mongoose.model("rooms", roomSchema);