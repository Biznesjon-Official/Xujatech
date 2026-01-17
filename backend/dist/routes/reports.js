"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
router.get('/cashiers/list', async (_req, res) => {
    try {
        const cashiers = await models_1.User.find({ role: 'cashier', isActive: true }).select('_id fullName username');
        res.json({ success: true, data: cashiers });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/cashiers/:cashierId/stats', async (req, res) => {
    try {
        const { cashierId } = req.params;
        const { period = 'today' } = req.query;
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        }
        else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        }
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        const cashier = await models_1.User.findById(cashierId).select('fullName username');
        if (!cashier) {
            return res.status(404).json({ success: false, message: 'Kassir topilmadi' });
        }
        const sales = await models_1.Sale.find({
            cashierId,
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed',
        }).populate('customerId', 'fullName phone');
        const productsMap = new Map();
        sales.forEach((sale) => {
            sale.items.forEach((item) => {
                const key = item.productId.toString();
                const existing = productsMap.get(key);
                if (existing) {
                    existing.quantity += item.quantity;
                    existing.totalAmount += item.totalPrice;
                }
                else {
                    productsMap.set(key, {
                        name: item.productName,
                        quantity: item.quantity,
                        totalAmount: item.totalPrice,
                    });
                }
            });
        });
        const productsSold = Array.from(productsMap.values()).sort((a, b) => b.quantity - a.quantity);
        const totalSalesCount = sales.length;
        const totalSalesAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
        const totalProductsSold = productsSold.reduce((sum, p) => sum + p.quantity, 0);
        const addedDebtLogs = await models_1.DebtLog.find({
            cashierId,
            action: 'added',
            createdAt: { $gte: startDate, $lte: endDate },
        })
            .populate('customerId', 'fullName phone')
            .sort({ createdAt: -1 });
        const debtsGiven = addedDebtLogs.map((log) => ({
            customerName: log.customerId?.fullName || "Noma'lum",
            customerPhone: log.customerId?.phone || '',
            amount: log.changeAmount,
            date: log.createdAt.toISOString(),
            notes: log.notes || '',
        }));
        const totalDebtGiven = debtsGiven.reduce((sum, d) => sum + d.amount, 0);
        const debtLogs = await models_1.DebtLog.find({
            cashierId,
            createdAt: { $gte: startDate, $lte: endDate },
        })
            .populate('customerId', 'fullName phone')
            .sort({ createdAt: -1 });
        const debtEdits = debtLogs
            .filter((log) => log.action === 'edited')
            .map((log) => ({
            customerName: log.customerId?.fullName || "Noma'lum",
            customerPhone: log.customerId?.phone || '',
            previousAmount: log.previousAmount,
            newAmount: log.newAmount,
            changeAmount: log.changeAmount,
            date: log.createdAt.toISOString(),
            notes: log.notes,
        }));
        const debtDeletes = debtLogs
            .filter((log) => log.action === 'deleted')
            .map((log) => ({
            customerName: log.customerId?.fullName || "Noma'lum",
            customerPhone: log.customerId?.phone || '',
            deletedAmount: log.previousAmount,
            date: log.createdAt.toISOString(),
            notes: log.notes,
        }));
        const customerIdsWithDebts = addedDebtLogs.map((log) => log.customerId);
        const paidDebtLogs = await models_1.DebtLog.find({
            customerId: { $in: customerIdsWithDebts },
            action: 'paid',
            createdAt: { $gte: startDate, $lte: endDate },
        })
            .populate('customerId', 'fullName phone')
            .sort({ createdAt: -1 });
        const debtsPaid = paidDebtLogs.map((log) => ({
            customerName: log.customerId?.fullName || "Noma'lum",
            customerPhone: log.customerId?.phone || '',
            amount: Math.abs(log.changeAmount),
            date: log.createdAt.toISOString(),
            notes: log.notes,
        }));
        const totalDebtPaid = debtsPaid.reduce((sum, d) => sum + d.amount, 0);
        res.json({
            success: true,
            data: {
                cashier: {
                    id: cashier._id,
                    name: cashier.fullName,
                    username: cashier.username,
                },
                summary: {
                    totalSalesCount,
                    totalSalesAmount,
                    totalProductsSold,
                    totalDebtGiven,
                    totalDebtPaid,
                    totalDebtEdits: debtEdits.length,
                    totalDebtDeletes: debtDeletes.length,
                },
                productsSold,
                debtsGiven,
                debtsPaid,
                debtEdits,
                debtDeletes,
            },
        });
    }
    catch (error) {
        console.error('Cashier stats error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/cashiers/summary', async (req, res) => {
    try {
        const { period = 'today' } = req.query;
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        }
        else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        }
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        const users = await models_1.User.find({ isActive: true });
        const summaries = await Promise.all(users.map(async (user) => {
            const salesStats = await models_1.Sale.aggregate([
                {
                    $match: {
                        cashierId: user._id,
                        createdAt: { $gte: startDate, $lte: endDate },
                        status: 'completed',
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: 1 },
                        totalAmount: { $sum: '$totalAmount' },
                    },
                },
            ]);
            const debtAddedStats = await models_1.DebtLog.aggregate([
                {
                    $match: {
                        cashierId: user._id,
                        action: 'added',
                        createdAt: { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalDebt: { $sum: '$changeAmount' },
                        debtCount: { $sum: 1 },
                    },
                },
            ]);
            const addedDebtCustomers = await models_1.DebtLog.find({
                cashierId: user._id,
                action: 'added',
            }).distinct('customerId');
            const debtPaidStats = await models_1.DebtLog.aggregate([
                {
                    $match: {
                        customerId: { $in: addedDebtCustomers },
                        action: 'paid',
                        createdAt: { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalPaid: { $sum: { $abs: '$changeAmount' } },
                        paidCount: { $sum: 1 },
                    },
                },
            ]);
            const debtLogStats = await models_1.DebtLog.aggregate([
                {
                    $match: {
                        cashierId: user._id,
                        createdAt: { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: '$action',
                        count: { $sum: 1 },
                    },
                },
            ]);
            const editCount = debtLogStats.find((s) => s._id === 'edited')?.count || 0;
            const deleteCount = debtLogStats.find((s) => s._id === 'deleted')?.count || 0;
            return {
                cashierId: user._id,
                cashierName: user.fullName,
                role: user.role,
                totalSales: salesStats[0]?.totalSales || 0,
                totalSalesAmount: salesStats[0]?.totalAmount || 0,
                totalDebtGiven: debtAddedStats[0]?.totalDebt || 0,
                totalDebtPaid: debtPaidStats[0]?.totalPaid || 0,
                debtCount: debtAddedStats[0]?.debtCount || 0,
                debtEdits: editCount,
                debtDeletes: deleteCount,
            };
        }));
        const activeSummaries = summaries.filter(s => s.totalSales > 0 || s.totalDebtGiven > 0 || s.totalDebtPaid > 0);
        const allSalesStats = await models_1.Sale.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'completed',
                },
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' },
                },
            },
        ]);
        const allDebtAddedStats = await models_1.DebtLog.aggregate([
            {
                $match: {
                    action: 'added',
                    createdAt: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: null,
                    totalDebt: { $sum: '$changeAmount' },
                },
            },
        ]);
        const allDebtPaidStats = await models_1.DebtLog.aggregate([
            {
                $match: {
                    action: 'paid',
                    createdAt: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: null,
                    totalPaid: { $sum: { $abs: '$changeAmount' } },
                },
            },
        ]);
        const totals = {
            totalSales: allSalesStats[0]?.totalSales || 0,
            totalAmount: allSalesStats[0]?.totalAmount || 0,
            totalDebt: allDebtAddedStats[0]?.totalDebt || 0,
            totalDebtPaid: allDebtPaidStats[0]?.totalPaid || 0,
        };
        res.json({
            success: true,
            data: {
                cashiers: activeSummaries.length > 0 ? activeSummaries : summaries,
                totals,
            },
        });
    }
    catch (error) {
        console.error('Cashiers summary error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/debt-log', async (req, res) => {
    try {
        const { customerId, cashierId, action, previousAmount, newAmount, notes } = req.body;
        const debtLog = new models_1.DebtLog({
            customerId,
            cashierId,
            action,
            previousAmount,
            newAmount,
            changeAmount: newAmount - previousAmount,
            notes,
        });
        await debtLog.save();
        res.json({ success: true, data: debtLog });
    }
    catch (error) {
        console.error('Debt log error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map