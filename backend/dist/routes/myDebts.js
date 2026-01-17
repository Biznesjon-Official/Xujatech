"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const MyDebt_1 = __importDefault(require("../models/MyDebt"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const debts = await MyDebt_1.default.find().sort({ createdAt: -1 });
        res.json({ success: true, data: debts });
    }
    catch (error) {
        console.error('Get my debts error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { creditorName, creditorPhone, amount, dueDate, notes, type } = req.body;
        const debt = new MyDebt_1.default({
            creditorName,
            creditorPhone,
            amount,
            paidAmount: 0,
            remainingAmount: amount,
            dueDate,
            notes,
            type: type || 'supplier',
            payments: [],
            status: 'active',
            createdBy: req.user?.id,
        });
        await debt.save();
        res.json({ success: true, data: debt });
    }
    catch (error) {
        console.error('Create my debt error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/:id/pay', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, notes } = req.body;
        const debt = await MyDebt_1.default.findById(id);
        if (!debt) {
            return res.status(404).json({ success: false, message: 'Qarz topilmadi' });
        }
        if (amount <= 0 || amount > debt.remainingAmount) {
            return res.status(400).json({ success: false, message: "Noto'g'ri summa" });
        }
        const payment = {
            _id: `payment_${Date.now()}`,
            amount,
            paidAt: new Date(),
            notes,
        };
        debt.payments.push(payment);
        debt.paidAmount += amount;
        debt.remainingAmount -= amount;
        if (debt.remainingAmount === 0) {
            debt.status = 'paid';
        }
        await debt.save();
        res.json({ success: true, data: debt });
    }
    catch (error) {
        console.error('Pay my debt error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await MyDebt_1.default.findByIdAndDelete(id);
        res.json({ success: true, message: "Qarz o'chirildi" });
    }
    catch (error) {
        console.error('Delete my debt error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const debt = await MyDebt_1.default.findById(id);
        if (!debt) {
            return res.status(404).json({ success: false, message: 'Qarz topilmadi' });
        }
        res.json({ success: true, data: debt });
    }
    catch (error) {
        console.error('Get my debt error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
//# sourceMappingURL=myDebts.js.map