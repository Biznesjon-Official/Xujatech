"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Return_1 = __importDefault(require("../models/Return"));
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const returns = await Return_1.default.find().sort({ createdAt: -1 });
        res.json({ success: true, data: returns });
    }
    catch (error) {
        console.error('Get returns error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { items, totalAmount, reason, customerName, customerPhone, notes, saleId } = req.body;
        const newReturn = new Return_1.default({
            saleId,
            items,
            totalAmount,
            reason,
            status: 'pending',
            customerName,
            customerPhone,
            notes,
            createdBy: req.user?.id,
        });
        await newReturn.save();
        res.json({ success: true, data: newReturn });
    }
    catch (error) {
        console.error('Create return error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/:id/approve', auth_1.authenticateToken, async (req, res) => {
    try {
        const returnDoc = await Return_1.default.findById(req.params.id);
        if (!returnDoc) {
            return res.status(404).json({ success: false, message: 'Qaytarish topilmadi' });
        }
        if (returnDoc.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Bu qaytarish allaqachon ko\'rib chiqilgan' });
        }
        for (const item of returnDoc.items) {
            await models_1.Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: item.quantity }
            });
        }
        returnDoc.status = 'approved';
        returnDoc.approvedBy = req.user?.id;
        returnDoc.approvedAt = new Date();
        await returnDoc.save();
        res.json({ success: true, data: returnDoc });
    }
    catch (error) {
        console.error('Approve return error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/:id/reject', auth_1.authenticateToken, async (req, res) => {
    try {
        const returnDoc = await Return_1.default.findById(req.params.id);
        if (!returnDoc) {
            return res.status(404).json({ success: false, message: 'Qaytarish topilmadi' });
        }
        if (returnDoc.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Bu qaytarish allaqachon ko\'rib chiqilgan' });
        }
        returnDoc.status = 'rejected';
        await returnDoc.save();
        res.json({ success: true, data: returnDoc });
    }
    catch (error) {
        console.error('Reject return error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const returnDoc = await Return_1.default.findById(req.params.id);
        if (!returnDoc) {
            return res.status(404).json({ success: false, message: 'Qaytarish topilmadi' });
        }
        if (returnDoc.status === 'approved') {
            for (const item of returnDoc.items) {
                await models_1.Product.findByIdAndUpdate(item.productId, {
                    $inc: { stock: -item.quantity }
                });
            }
        }
        await Return_1.default.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Qaytarish o\'chirildi' });
    }
    catch (error) {
        console.error('Delete return error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
//# sourceMappingURL=returns.js.map