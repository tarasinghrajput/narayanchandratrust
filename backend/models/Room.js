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
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'student'
  }],
  status: {
    type: String,
    enum: ['available', 'occupied'],
    default: 'available'
  }
});

// Add virtual field for available beds
roomSchema.virtual('availableBeds').get(function() {
  return this.capacity - this.students.length;
});

module.exports = mongoose.model('room', roomSchema);