const Room = require("../models/Room");

// 🟢 Get all rooms with availability info
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms", error });
  }
};

// 🟢 Create a new room
exports.createRoom = async (req, res) => {
  try {
    const { roomNumber } = req.body;
    const existingRoom = await Room.findOne({ roomNumber });

    if (existingRoom) {
      return res.status(400).json({ message: "Room already exists" });
    }

    const newRoom = new Room({ roomNumber });
    await newRoom.save();
    res.status(201).json({ message: "Room created successfully", newRoom });
  } catch (error) {
    res.status(500).json({ message: "Error creating room", error });
  }
};

// 🟢 Update room occupancy
exports.updateRoomOccupancy = async (req, res) => {
  try {
    const { roomNumber, occupiedSlots } = req.body;
    const room = await Room.findOne({ roomNumber });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (occupiedSlots < 0 || occupiedSlots > room.totalCapacity) {
      return res.status(400).json({ message: "Invalid number of occupied slots" });
    }

    room.occupiedSlots = occupiedSlots;
    await room.save();
    res.json({ message: "Room occupancy updated", room });
  } catch (error) {
    res.status(500).json({ message: "Error updating room occupancy", error });
  }
};

// 🟢 Delete a room
exports.deleteRoom = async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const deletedRoom = await Room.findOneAndDelete({ roomNumber });

    if (!deletedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting room", error });
  }
};