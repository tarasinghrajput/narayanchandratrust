const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { generateToken, verifyToken } = require('../utils/auth');
const User = require('../models/User');

exports.login = async (req, res, next) => {
    console.log("login hits here");
    let success = false;
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({success, errors: errors.array() });
        }
        
        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({success, errors: [{ msg: 'Invalid credentials' }] });
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({success, errors: [{ msg: 'Invalid credentials' }] });
            }
            const token = generateToken(user.id, user.isAdmin);
            res.status(200).json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        isAdmin: user.isAdmin,
                    },
                },
            });

        }
        catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    } catch (error) {
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    let success = false;
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({success, errors: errors.array() });
        }

        const { email, password, newPassword } = req.body;

        try {
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({success, errors: [{ msg: 'Invalid credentials' }] });
            }

            const oldPassword = await bcrypt.compare(password, user.password);

            if (!oldPassword) {
                return res.status(400).json({success, errors: [{ msg: 'Invalid credentials' }] });
            }

            const salt = await bcrypt.genSalt(10);
            const newp = await bcrypt.hash(newPassword, salt);

            user.password = newp;
            await user.save();

            success = true;
            res.status(200).json({ success, msg: 'Password changed successfully' });

        }
        catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    } catch (error) {
        next(error);
    }
}

exports.verifySession = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];  // ✅ Get token from header

        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided." });
        }

        // ✅ Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.status(200).json({ success: true, isAdmin: user.isAdmin });
    } catch (error) {
        console.error("❌ Session Verification Failed:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

