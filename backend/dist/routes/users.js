"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const users = await models_1.User.find({ isActive: true })
            .select('-password')
            .sort({ fullName: 1 });
        res.json({ success: true, data: users });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const user = await models_1.User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { username, password, fullName, email, phone, role } = req.body;
        const existingUser = await models_1.User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Bu username allaqachon mavjud' });
        }
        const user = new models_1.User({ username, password, fullName, email, phone, role });
        await user.save();
        const userData = user.toObject();
        delete userData.password;
        res.status(201).json({ success: true, data: userData });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { password, ...updateData } = req.body;
        const user = await models_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
        }
        Object.assign(user, updateData);
        if (password && password.trim()) {
            user.password = password;
        }
        await user.save();
        const userData = user.toObject();
        delete userData.password;
        res.json({ success: true, data: userData });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.put('/:id/password', async (req, res) => {
    try {
        const { newPassword } = req.body;
        const user = await models_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
        }
        user.password = newPassword;
        await user.save();
        res.json({ success: true, message: 'Parol o\'zgartirildi' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await models_1.User.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ success: true, message: 'Foydalanuvchi o\'chirildi' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map