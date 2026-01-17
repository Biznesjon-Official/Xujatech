"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SavedReceipt_1 = require("../models/SavedReceipt");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/saved', auth_1.authenticateToken, async (req, res) => {
    try {
        const { status, source, cashierId } = req.query;
        const filter = {};
        filter.status = status || 'saved';
        if (source)
            filter.source = source;
        if (cashierId)
            filter.cashierId = cashierId;
        const receipts = await SavedReceipt_1.SavedReceipt.find(filter)
            .sort({ createdAt: -1 })
            .limit(100);
        res.json({ success: true, data: receipts });
    }
    catch (error) {
        console.error('Saqlangan cheklar xatosi:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/saved/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const receipt = await SavedReceipt_1.SavedReceipt.findById(req.params.id);
        if (!receipt) {
            return res.status(404).json({ success: false, message: 'Chek topilmadi' });
        }
        res.json({ success: true, data: receipt });
    }
    catch (error) {
        console.error('Chek olish xatosi:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/saved', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id, cashierId, cashierName, items, total, source, customerId, customerName } = req.body;
        if (id) {
            const existing = await SavedReceipt_1.SavedReceipt.findOne({ localId: id });
            if (existing) {
                return res.json({ success: true, data: existing, message: 'Chek allaqachon mavjud' });
            }
        }
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Mahsulotlar kerak' });
        }
        const calculatedTotal = total || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const receipt = new SavedReceipt_1.SavedReceipt({
            localId: id,
            cashierId: cashierId || req.user?.userId,
            cashierName: cashierName || req.user?.fullName,
            items,
            total: calculatedTotal,
            status: 'saved',
            source: source || 'mobile',
            customerId,
            customerName,
        });
        await receipt.save();
        res.status(201).json({ success: true, data: receipt });
    }
    catch (error) {
        console.error('Chek yaratish xatosi:', error);
        res.status(500).json({ success: false, message: error.message || 'Server xatosi' });
    }
});
router.patch('/saved/:id/status', auth_1.authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['saved', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Noto\'g\'ri status' });
        }
        const receipt = await SavedReceipt_1.SavedReceipt.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!receipt) {
            return res.status(404).json({ success: false, message: 'Chek topilmadi' });
        }
        res.json({ success: true, data: receipt });
    }
    catch (error) {
        console.error('Chek statusini yangilash xatosi:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.delete('/saved/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const receipt = await SavedReceipt_1.SavedReceipt.findByIdAndDelete(req.params.id);
        if (!receipt) {
            return res.status(404).json({ success: false, message: 'Chek topilmadi' });
        }
        res.json({ success: true, message: 'Chek o\'chirildi' });
    }
    catch (error) {
        console.error('Chek o\'chirish xatosi:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/saved/sync', auth_1.authenticateToken, async (req, res) => {
    try {
        const { receipts } = req.body;
        if (!Array.isArray(receipts)) {
            return res.status(400).json({ success: false, message: 'receipts massiv bo\'lishi kerak' });
        }
        const results = [];
        for (const receiptData of receipts) {
            try {
                const existing = await SavedReceipt_1.SavedReceipt.findOne({ localId: receiptData.id });
                if (existing) {
                    results.push({ id: receiptData.id, status: 'exists' });
                    continue;
                }
                const receipt = new SavedReceipt_1.SavedReceipt({
                    localId: receiptData.id,
                    cashierId: receiptData.cashierId || req.user?.userId,
                    cashierName: receiptData.cashierName,
                    items: receiptData.items,
                    total: receiptData.total,
                    status: receiptData.status || 'saved',
                    source: receiptData.source || 'mobile',
                    customerId: receiptData.customerId,
                    customerName: receiptData.customerName,
                });
                await receipt.save();
                results.push({ id: receiptData.id, status: 'created' });
            }
            catch (err) {
                results.push({ id: receiptData.id, status: 'error', message: err.message });
            }
        }
        res.json({ success: true, data: results });
    }
    catch (error) {
        console.error('Cheklar sinxronizatsiya xatosi:', error);
        res.status(500).json({ success: false, message: error.message || 'Server xatosi' });
    }
});
exports.default = router;
//# sourceMappingURL=receipts.js.map