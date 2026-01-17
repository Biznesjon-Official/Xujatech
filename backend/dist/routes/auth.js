"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username va password kerak' });
        }
        const user = await models_1.User.findOne({ username, isActive: true });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Login yoki parol xato' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Login yoki parol xato' });
        }
        user.lastLogin = new Date();
        await user.save();
        const accessToken = jsonwebtoken_1.default.sign({ userId: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role
                },
                accessToken,
                refreshToken
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token kerak' });
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = await models_1.User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, data: { accessToken } });
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
});
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'Token kerak' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await models_1.User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User topilmadi' });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map