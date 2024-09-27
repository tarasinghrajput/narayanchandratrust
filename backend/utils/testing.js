const mongoose = require('mongoose');
require('dotenv').config();
const mongoURI = "mongodb://127.0.0.1:27017/hostel";

const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        });
        console.log('MongoDB connection SUCCESS');
    } catch (error) {
        console.error('MongoDB connection FAIL');
        process.exit(1);
    }
    };

connectDB();