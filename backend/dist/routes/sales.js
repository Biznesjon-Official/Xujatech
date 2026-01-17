"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate, status, customerId, cashierId } = req.query;
        const filter = {};
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        if (status)
            filter.status = status;
        if (customerId)
            filter.customerId = customerId;
        if (cashierId)
            filter.cashierId = cashierId;
        const sales = await models_1.Sale.find(filter)
            .populate('customerId', 'fullName phone')
            .populate('cashierId', 'fullName')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json({ success: true, data: sales });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const sale = await models_1.Sale.findById(req.params.id)
            .populate('customerId', 'fullName phone')
            .populate('cashierId', 'fullName');
        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sotuv topilmadi' });
        }
        res.json({ success: true, data: sale });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { customerId, items, payments, discountAmount, notes } = req.body;
        const cashierId = req.user?.userId || req.user?.id;
        if (!cashierId) {
            throw new Error('Kassir aniqlanmadi. Qayta login qiling.');
        }
        let subtotal = 0;
        const saleItems = [];
        for (const item of items) {
            const product = await models_1.Product.findById(item.productId).session(session);
            if (!product) {
                throw new Error(`Mahsulot topilmadi: ${item.productId}`);
            }
            if (product.currentStock < item.quantity) {
                throw new Error(`Yetarli mahsulot yo'q: ${product.name}`);
            }
            const totalPrice = (item.unitPrice * item.quantity) - (item.discountAmount || 0);
            subtotal += totalPrice;
            saleItems.push({
                productId: product._id,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discountAmount: item.discountAmount || 0,
                totalPrice
            });
            product.currentStock -= item.quantity;
            await product.save({ session });
        }
        const totalAmount = subtotal - (discountAmount || 0);
        const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        const changeAmount = Math.max(0, paidAmount - totalAmount);
        const hasDebtPayment = payments.some((p) => p.method === 'debt');
        if (hasDebtPayment && customerId) {
            const debtAmount = payments.find((p) => p.method === 'debt')?.amount || 0;
            await models_1.Customer.findByIdAndUpdate(customerId, { $inc: { currentDebt: debtAmount, totalPurchases: totalAmount } }, { session });
        }
        else if (customerId) {
            await models_1.Customer.findByIdAndUpdate(customerId, { $inc: { totalPurchases: totalAmount } }, { session });
        }
        const sale = new models_1.Sale({
            customerId,
            cashierId,
            items: saleItems,
            payments,
            subtotal,
            discountAmount: discountAmount || 0,
            taxAmount: 0,
            totalAmount,
            paidAmount,
            changeAmount,
            status: 'completed',
            notes
        });
        await sale.save({ session });
        await session.commitTransaction();
        res.status(201).json({ success: true, data: sale });
    }
    catch (error) {
        await session.abortTransaction();
        console.error('Create sale error:', error);
        res.status(400).json({ success: false, message: error.message || 'Sotuv yaratishda xatolik' });
    }
    finally {
        session.endSession();
    }
});
router.post('/:id/cancel', auth_1.authenticateToken, async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const sale = await models_1.Sale.findById(req.params.id).session(session);
        if (!sale) {
            throw new Error('Sotuv topilmadi');
        }
        if (sale.status !== 'completed') {
            throw new Error('Faqat yakunlangan sotuvni bekor qilish mumkin');
        }
        for (const item of sale.items) {
            await models_1.Product.findByIdAndUpdate(item.productId, { $inc: { currentStock: item.quantity } }, { session });
        }
        const debtPayment = sale.payments.find(p => p.method === 'debt');
        if (debtPayment && sale.customerId) {
            await models_1.Customer.findByIdAndUpdate(sale.customerId, { $inc: { currentDebt: -debtPayment.amount, totalPurchases: -sale.totalAmount } }, { session });
        }
        sale.status = 'cancelled';
        await sale.save({ session });
        await session.commitTransaction();
        res.json({ success: true, data: sale });
    }
    catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    }
    finally {
        session.endSession();
    }
});
exports.default = router;
//# sourceMappingURL=sales.js.map