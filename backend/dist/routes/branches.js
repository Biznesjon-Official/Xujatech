"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const branches = await models_1.Branch.find().sort({ isMain: -1, createdAt: -1 });
        res.json({ success: true, data: branches });
    }
    catch (error) {
        console.error('Get branches error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const branch = await models_1.Branch.findById(req.params.id);
        if (!branch) {
            return res.status(404).json({ success: false, message: 'Filial topilmadi' });
        }
        res.json({ success: true, data: branch });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/', async (req, res) => {
    try {
        const branch = new models_1.Branch(req.body);
        await branch.save();
        res.status(201).json({ success: true, data: branch });
    }
    catch (error) {
        console.error('Create branch error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const branch = await models_1.Branch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!branch) {
            return res.status(404).json({ success: false, message: 'Filial topilmadi' });
        }
        res.json({ success: true, data: branch });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const branch = await models_1.Branch.findByIdAndDelete(req.params.id);
        if (!branch) {
            return res.status(404).json({ success: false, message: 'Filial topilmadi' });
        }
        res.json({ success: true, message: "Filial o'chirildi" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
//# sourceMappingURL=branches.js.map