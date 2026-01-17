"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
router.get('/stock', async (req, res) => {
    try {
        const { lowStock } = req.query;
        let filter = { isActive: true };
        if (lowStock === 'true') {
            filter.$expr = { $lte: ['$currentStock', '$minimumStock'] };
        }
        const products = await models_1.Product.find(filter)
            .populate('categoryId', 'name')
            .sort({ currentStock: 1 });
        const data = products.map(p => ({
            id: p._id,
            name: p.name,
            barcode: p.barcode,
            current_stock: p.currentStock,
            minimum_stock: p.minimumStock,
            category_name: p.categoryId?.name || ''
        }));
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/adjust', async (req, res) => {
    try {
        const { productId, quantity, type, reason } = req.body;
        const product = await models_1.Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Mahsulot topilmadi' });
        }
        if (type === 'in') {
            product.currentStock += quantity;
        }
        else if (type === 'out') {
            if (product.currentStock < quantity) {
                return res.status(400).json({ success: false, message: 'Yetarli mahsulot yo\'q' });
            }
            product.currentStock -= quantity;
        }
        else {
            product.currentStock = quantity;
        }
        await product.save();
        res.json({ success: true, data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
//# sourceMappingURL=inventory.js.map