"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { search, hasDebt, createdBy } = req.query;
        const filter = { isActive: true };
        if (createdBy) {
            filter.createdBy = createdBy;
        }
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        if (hasDebt === 'true') {
            filter.currentDebt = { $gt: 0 };
        }
        const customers = await models_1.Customer.find(filter).sort({ fullName: 1 });
        res.json({ success: true, data: customers });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const totalCustomers = await models_1.Customer.countDocuments({ isActive: true });
        const totalDebt = await models_1.Customer.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, total: { $sum: '$currentDebt' } } }
        ]);
        res.json({
            success: true,
            data: {
                totalCustomers,
                totalDebt: totalDebt[0]?.total || 0
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const customer = await models_1.Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Mijoz topilmadi' });
        }
        res.json({ success: true, data: customer });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/', async (req, res) => {
    try {
        const customer = new models_1.Customer(req.body);
        await customer.save();
        res.status(201).json({ success: true, data: customer });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const customer = await models_1.Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Mijoz topilmadi' });
        }
        const previousDebt = customer.currentDebt;
        const newDebt = req.body.currentDebt;
        if (newDebt !== undefined && newDebt !== previousDebt && req.body.cashierId) {
            await models_1.DebtLog.create({
                customerId: customer._id,
                cashierId: req.body.cashierId,
                action: 'edited',
                previousAmount: previousDebt,
                newAmount: newDebt,
                changeAmount: newDebt - previousDebt,
                notes: req.body.debtNotes || 'Qarz tahrirlandi',
            });
        }
        Object.assign(customer, req.body);
        await customer.save();
        res.json({ success: true, data: customer });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/:id/pay-debt', async (req, res) => {
    try {
        const { amount, cashierId, notes, receivedBy } = req.body;
        const customer = await models_1.Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Mijoz topilmadi' });
        }
        const previousDebt = customer.currentDebt;
        customer.currentDebt = Math.max(0, customer.currentDebt - amount);
        const paymentNotes = receivedBy
            ? `${amount} so'm to'landi. Qabul qildi: ${receivedBy}`
            : notes || `${amount} so'm to'landi`;
        await models_1.DebtLog.create({
            customerId: customer._id,
            cashierId: cashierId || undefined,
            action: 'paid',
            previousAmount: previousDebt,
            newAmount: customer.currentDebt,
            changeAmount: customer.currentDebt - previousDebt,
            notes: paymentNotes,
            receivedBy: receivedBy || undefined,
        });
        await customer.save();
        res.json({ success: true, data: customer });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/:id/add-debt', async (req, res) => {
    try {
        const { amount, initialPayment, dueDate, notes, cashierId, guarantor, isInstallment, installmentCount, installmentDates } = req.body;
        const customer = await models_1.Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Mijoz topilmadi' });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Qarz summasi noto\'g\'ri' });
        }
        const initialPaymentAmount = initialPayment || 0;
        if (initialPaymentAmount > amount) {
            return res.status(400).json({ success: false, message: 'Boshlang\'ich to\'lov jami summadan katta bo\'lishi mumkin emas' });
        }
        const previousDebt = customer.currentDebt || 0;
        const finalDebtAmount = amount - initialPaymentAmount;
        customer.currentDebt = previousDebt + finalDebtAmount;
        if (dueDate) {
            customer.debtDueDate = new Date(dueDate);
        }
        let installments = [];
        if (isInstallment && installmentCount && installmentCount > 1) {
            const installmentAmount = Math.ceil(finalDebtAmount / installmentCount);
            for (let i = 0; i < installmentCount; i++) {
                let installmentDueDate;
                if (installmentDates && installmentDates[i]) {
                    installmentDueDate = new Date(installmentDates[i]);
                }
                else {
                    installmentDueDate = new Date();
                    installmentDueDate.setMonth(installmentDueDate.getMonth() + i + 1);
                }
                const isLast = i === installmentCount - 1;
                const thisAmount = isLast
                    ? finalDebtAmount - (installmentAmount * (installmentCount - 1))
                    : installmentAmount;
                installments.push({
                    installmentNumber: i + 1,
                    amount: thisAmount,
                    dueDate: installmentDueDate,
                    isPaid: false,
                    paidAmount: 0,
                });
            }
        }
        const logNotes = initialPaymentAmount > 0
            ? `${amount} so'm qarz qo'shildi. Boshlang'ich to'lov: ${initialPaymentAmount} so'm. Qoldiq qarz: ${finalDebtAmount} so'm`
            : `${finalDebtAmount} so'm qarz qo'shildi`;
        await models_1.DebtLog.create({
            customerId: customer._id,
            cashierId: cashierId || null,
            action: 'added',
            previousAmount: previousDebt,
            newAmount: customer.currentDebt,
            changeAmount: finalDebtAmount,
            notes: notes || logNotes,
            guarantor: guarantor ? {
                fullName: guarantor.fullName,
                phone: guarantor.phone || undefined,
                address: guarantor.address || undefined,
            } : undefined,
            isInstallment: isInstallment || false,
            installmentCount: installmentCount || undefined,
            installments: installments.length > 0 ? installments : undefined,
            initialPayment: initialPaymentAmount > 0 ? initialPaymentAmount : undefined,
        });
        if (initialPaymentAmount > 0) {
            await models_1.DebtLog.create({
                customerId: customer._id,
                cashierId: cashierId || null,
                action: 'payment',
                previousAmount: previousDebt + amount,
                newAmount: customer.currentDebt,
                changeAmount: initialPaymentAmount,
                notes: `Boshlang'ich to'lov: ${initialPaymentAmount} so'm`,
            });
        }
        await customer.save();
        const responseMessage = initialPaymentAmount > 0
            ? `Qarz qo'shildi. Boshlang'ich to'lov: ${initialPaymentAmount.toLocaleString()} so'm`
            : "Qarz qo'shildi";
        res.json({ success: true, data: customer, message: responseMessage });
    }
    catch (error) {
        console.error('Add debt error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/debts/all', async (req, res) => {
    try {
        const { User } = await Promise.resolve().then(() => __importStar(require('../models')));
        const customers = await models_1.Customer.find({
            isActive: true,
            currentDebt: { $gt: 0 }
        }).sort({ currentDebt: -1 });
        const result = await Promise.all(customers.map(async (customer) => {
            const lastDebtLog = await models_1.DebtLog.findOne({
                customerId: customer._id,
                action: 'added'
            }).sort({ createdAt: -1 });
            const paidLogs = await models_1.DebtLog.find({
                customerId: customer._id,
                action: 'paid'
            });
            const totalPaid = paidLogs.reduce((sum, log) => sum + Math.abs(log.changeAmount), 0);
            let cashierName = 'Admin';
            if (lastDebtLog?.cashierId) {
                const cashier = await User.findById(lastDebtLog.cashierId);
                if (cashier) {
                    cashierName = cashier.role === 'admin' ? 'Admin' : cashier.fullName;
                }
            }
            let status = 'pending';
            if (customer.currentDebt === 0) {
                status = 'paid';
            }
            else if (customer.debtDueDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dueDate = new Date(customer.debtDueDate);
                dueDate.setHours(0, 0, 0, 0);
                if (dueDate < today) {
                    status = 'overdue';
                }
                else if (dueDate.getTime() === today.getTime()) {
                    status = 'today';
                }
            }
            return {
                ...customer.toObject(),
                addedBy: cashierName,
                lastDebtDate: lastDebtLog?.createdAt || null,
                totalPaid,
                status,
            };
        }));
        res.json({ success: true, data: result });
    }
    catch (error) {
        console.error('Get all debts error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/debt-logs/all', async (req, res) => {
    try {
        const logs = await models_1.DebtLog.find()
            .populate('customerId', 'fullName phone')
            .sort({ createdAt: -1 })
            .limit(500);
        const history = logs.map(log => ({
            _id: log._id,
            customerId: log.customerId,
            customerName: log.customerId?.fullName || 'Noma\'lum',
            customerPhone: log.customerId?.phone || '',
            action: log.action,
            amount: Math.abs(log.changeAmount),
            previousAmount: log.previousAmount,
            newAmount: log.newAmount,
            notes: log.notes,
            receivedBy: log.receivedBy || null,
            createdAt: log.createdAt,
        }));
        res.json({ success: true, data: history });
    }
    catch (error) {
        console.error('Get all debt logs error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/:id/debt-history', async (req, res) => {
    try {
        const logs = await models_1.DebtLog.find({ customerId: req.params.id })
            .sort({ createdAt: -1 })
            .limit(50);
        const history = logs.map(log => ({
            type: log.action === 'paid' ? 'payment' : 'debt',
            amount: Math.abs(log.changeAmount),
            createdAt: log.createdAt,
            notes: log.notes,
            receivedBy: log.receivedBy || null,
            guarantor: log.guarantor || null,
            isInstallment: log.isInstallment || false,
            installmentCount: log.installmentCount || null,
            installments: log.installments || [],
        }));
        res.json({ success: true, data: history });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/debts/by-cashier/:cashierId', async (req, res) => {
    try {
        const { cashierId } = req.params;
        const debtLogs = await models_1.DebtLog.find({
            cashierId,
            action: 'added'
        })
            .sort({ createdAt: -1 })
            .limit(100);
        const customerIds = [...new Set(debtLogs.map(log => log.customerId))];
        const customers = await models_1.Customer.find({ _id: { $in: customerIds } });
        const customerMap = new Map(customers.map(c => [c._id.toString(), c]));
        const debts = debtLogs.map(log => {
            const customer = customerMap.get(log.customerId.toString());
            return {
                _id: log._id,
                customerId: log.customerId,
                customerName: customer?.fullName || 'Noma\'lum',
                customerPhone: customer?.phone || '',
                amount: log.changeAmount,
                notes: log.notes,
                createdAt: log.createdAt,
                dueDate: customer?.debtDueDate,
            };
        });
        res.json({ success: true, data: debts });
    }
    catch (error) {
        console.error('Get debts by cashier error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/:id/delete-debt', async (req, res) => {
    try {
        const { cashierId, notes, debtLogId } = req.body;
        console.log('Delete debt request:', { id: req.params.id, cashierId, notes, debtLogId });
        const customer = await models_1.Customer.findById(req.params.id);
        if (!customer) {
            console.log('Customer not found:', req.params.id);
            return res.status(404).json({ success: false, message: 'Mijoz topilmadi' });
        }
        const previousDebt = customer.currentDebt;
        console.log('Previous debt:', previousDebt);
        if (debtLogId) {
            const debtLog = await models_1.DebtLog.findById(debtLogId);
            if (debtLog && debtLog.action === 'added') {
                const amountToRemove = debtLog.changeAmount;
                customer.currentDebt = Math.max(0, customer.currentDebt - amountToRemove);
                await models_1.DebtLog.create({
                    customerId: customer._id,
                    cashierId: cashierId || null,
                    action: 'deleted',
                    previousAmount: previousDebt,
                    newAmount: customer.currentDebt,
                    changeAmount: -amountToRemove,
                    notes: notes || `${amountToRemove} so'm qarz o'chirildi`,
                });
                await customer.save();
                return res.json({ success: true, data: customer, message: "Qarz o'chirildi" });
            }
        }
        if (previousDebt > 0) {
            await models_1.DebtLog.create({
                customerId: customer._id,
                cashierId: cashierId || null,
                action: 'deleted',
                previousAmount: previousDebt,
                newAmount: 0,
                changeAmount: -previousDebt,
                notes: notes || "Qarz o'chirildi",
            });
        }
        customer.currentDebt = 0;
        await customer.save();
        console.log('Debt deleted successfully');
        res.json({ success: true, data: customer, message: "Qarz o'chirildi" });
    }
    catch (error) {
        console.error('Delete debt error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await models_1.Customer.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ success: true, message: 'Mijoz o\'chirildi' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
//# sourceMappingURL=customers.js.map