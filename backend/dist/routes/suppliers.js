"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const suppliers = await models_1.Supplier.find({ isActive: true }).sort({ name: 1 });
        res.json({ success: true, data: suppliers });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const supplier = await models_1.Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Ta\'minotchi topilmadi' });
        }
        res.json({ success: true, data: supplier });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/', async (req, res) => {
    try {
        const supplier = new models_1.Supplier(req.body);
        await supplier.save();
        res.status(201).json({ success: true, data: supplier });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const supplier = await models_1.Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Ta\'minotchi topilmadi' });
        }
        res.json({ success: true, data: supplier });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await models_1.Supplier.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ success: true, message: 'Ta\'minotchi o\'chirildi' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
//# sourceMappingURL=suppliers.js.map