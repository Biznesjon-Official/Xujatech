"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const categories = await models_1.Category.find({ isActive: true })
            .populate('parentId', 'name')
            .sort({ name: 1 });
        res.json({ success: true, data: categories });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const category = await models_1.Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Kategoriya topilmadi' });
        }
        res.json({ success: true, data: category });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/', async (req, res) => {
    try {
        const category = new models_1.Category(req.body);
        await category.save();
        res.status(201).json({ success: true, data: category });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const category = await models_1.Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Kategoriya topilmadi' });
        }
        res.json({ success: true, data: category });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await models_1.Category.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ success: true, message: 'Kategoriya o\'chirildi' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
//# sourceMappingURL=categories.js.map