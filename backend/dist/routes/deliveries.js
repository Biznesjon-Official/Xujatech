"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, supplierId } = req.query;
        const filter = {};
        if (startDate && endDate) {
            filter.deliveryDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        if (supplierId) {
            filter.supplierId = supplierId;
        }
        const deliveries = await models_1.Delivery.find(filter)
            .sort({ deliveryDate: -1 })
            .populate('supplierId', 'name phone')
            .populate('items.productId', 'name barcode');
        res.json({ success: true, data: deliveries });
    }
    catch (error) {
        console.error('Get deliveries error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const delivery = await models_1.Delivery.findById(req.params.id)
            .populate('supplierId', 'name phone')
            .populate('items.productId', 'name barcode');
        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Topilmadi' });
        }
        res.json({ success: true, data: delivery });
    }
    catch (error) {
        console.error('Get delivery error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/', async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { supplierName, supplierPhone, items, notes, deliveryDate } = req.body;
        if (!supplierName || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Ta'minotchi nomi va mahsulotlar kerak",
            });
        }
        let supplier = await models_1.Supplier.findOne({
            name: { $regex: new RegExp(`^${supplierName}$`, 'i') },
        });
        if (!supplier) {
            supplier = await models_1.Supplier.create([
                {
                    name: supplierName,
                    phone: supplierPhone,
                    isActive: true,
                },
            ], { session }).then((docs) => docs[0]);
        }
        else if (supplierPhone && supplier.phone !== supplierPhone) {
            supplier.phone = supplierPhone;
            await supplier.save({ session });
        }
        const deliveryItems = [];
        let totalAmount = 0;
        for (const item of items) {
            const { productId, quantity, purchasePrice } = item;
            if (!productId || !quantity || quantity <= 0) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri mahsulot ma'lumotlari",
                });
            }
            const product = await models_1.Product.findById(productId).session(session);
            if (!product) {
                await session.abortTransaction();
                return res.status(404).json({
                    success: false,
                    message: `Mahsulot topilmadi: ${productId}`,
                });
            }
            const previousStock = product.currentStock;
            product.currentStock = previousStock + quantity;
            if (purchasePrice && purchasePrice > 0) {
                product.purchasePrice = purchasePrice;
            }
            await product.save({ session });
            const itemTotal = quantity * (purchasePrice || product.purchasePrice);
            totalAmount += itemTotal;
            deliveryItems.push({
                productId: product._id,
                productName: product.name,
                quantity,
                purchasePrice: purchasePrice || product.purchasePrice,
                totalPrice: itemTotal,
            });
            console.log(`📦 ${product.name}: ${previousStock} + ${quantity} = ${product.currentStock}`);
        }
        const delivery = await models_1.Delivery.create([
            {
                supplierId: supplier._id,
                supplierName: supplier.name,
                supplierPhone: supplier.phone,
                items: deliveryItems,
                totalAmount,
                notes,
                deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
            },
        ], { session }).then((docs) => docs[0]);
        await session.commitTransaction();
        res.status(201).json({
            success: true,
            data: delivery,
            message: "Tovar kelishi saqlandi va ombor yangilandi",
        });
    }
    catch (error) {
        await session.abortTransaction();
        console.error('Create delivery error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
    finally {
        session.endSession();
    }
});
router.delete('/:id', async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const delivery = await models_1.Delivery.findById(req.params.id).session(session);
        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Topilmadi' });
        }
        for (const item of delivery.items) {
            await models_1.Product.findByIdAndUpdate(item.productId, { $inc: { currentStock: -item.quantity } }, { session });
        }
        await models_1.Delivery.findByIdAndDelete(req.params.id).session(session);
        await session.commitTransaction();
        res.json({
            success: true,
            message: "Yetkazib berish o'chirildi va ombor yangilandi",
        });
    }
    catch (error) {
        await session.abortTransaction();
        console.error('Delete delivery error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
    finally {
        session.endSession();
    }
});
router.get('/stats/monthly', async (req, res) => {
    try {
        const { year, month } = req.query;
        const now = new Date();
        const targetYear = year ? parseInt(year) : now.getFullYear();
        const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
        const stats = await models_1.Delivery.aggregate([
            {
                $match: {
                    deliveryDate: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: null,
                    totalDeliveries: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' },
                    totalItems: { $sum: { $size: '$items' } },
                },
            },
        ]);
        const dailyStats = await models_1.Delivery.aggregate([
            {
                $match: {
                    deliveryDate: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: { $dayOfMonth: '$deliveryDate' },
                    count: { $sum: 1 },
                    amount: { $sum: '$totalAmount' },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        res.json({
            success: true,
            data: {
                year: targetYear,
                month: targetMonth + 1,
                summary: stats[0] || { totalDeliveries: 0, totalAmount: 0, totalItems: 0 },
                daily: dailyStats,
            },
        });
    }
    catch (error) {
        console.error('Get monthly stats error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
//# sourceMappingURL=deliveries.js.map