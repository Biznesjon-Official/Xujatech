import express from 'express';
import MyDebt from '../models/MyDebt';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Barcha qarzlarni olish
router.get('/', authenticateToken, async (req, res) => {
  try {
    const debts = await MyDebt.find().sort({ createdAt: -1 });
    res.json({ success: true, data: debts });
  } catch (error) {
    console.error('Get my debts error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Yangi qarz qo'shish
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { creditorName, creditorPhone, amount, dueDate, notes, type, initialPayment } = req.body;
    
    // Boshlang'ich to'lovni tekshirish
    const initialPay = parseFloat(initialPayment) || 0;
    const totalAmount = parseFloat(amount) || 0;
    
    if (initialPay > totalAmount) {
      return res.status(400).json({ 
        success: false, 
        message: "Boshlang'ich to'lov jami summadan katta bo'lishi mumkin emas" 
      });
    }
    
    const remainingAmount = totalAmount - initialPay;
    const payments = [];
    
    // Agar boshlang'ich to'lov bo'lsa, uni to'lov sifatida qo'shamiz
    if (initialPay > 0) {
      payments.push({
        _id: `initial_payment_${Date.now()}`,
        amount: initialPay,
        paidAt: new Date(),
        notes: `Boshlang'ich to'lov - qarz belgilanayotgan paytda to'landi`,
        type: 'full',
      });
    }
    
    const debt = new MyDebt({
      creditorName,
      creditorPhone,
      amount: totalAmount,
      paidAmount: initialPay,
      remainingAmount: remainingAmount,
      dueDate,
      notes,
      type: type || 'supplier',
      payments: payments,
      status: remainingAmount === 0 ? 'paid' : 'active',
      createdBy: (req as any).user?.id,
    });
    
    await debt.save();
    
    let message = "Qarz qo'shildi";
    if (initialPay > 0) {
      if (remainingAmount === 0) {
        message = `Qarz to'liq to'landi! Boshlang'ich to'lov: ${initialPay.toLocaleString()} so'm`;
      } else {
        message = `Qarz qo'shildi. Boshlang'ich to'lov: ${initialPay.toLocaleString()} so'm. Qoldiq: ${remainingAmount.toLocaleString()} so'm`;
      }
    }
    
    res.json({ success: true, data: debt, message });
  } catch (error) {
    console.error('Create my debt error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Qarzga to'lov qilish
router.post('/:id/pay', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;
    
    const debt = await MyDebt.findById(id);
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
  } catch (error) {
    console.error('Pay my debt error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Qarzni qisman to'lash (bir qismini berish)
router.post('/:id/partial-pay', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, notes, recipientName, recipientPhone } = req.body;
    
    const debt = await MyDebt.findById(id);
    if (!debt) {
      return res.status(404).json({ success: false, message: 'Qarz topilmadi' });
    }
    
    if (amount <= 0 || amount > debt.remainingAmount) {
      return res.status(400).json({ success: false, message: "Noto'g'ri summa" });
    }
    
    const partialPayment = {
      _id: `partial_payment_${Date.now()}`,
      amount,
      paidAt: new Date(),
      notes: notes || `Qisman to'lov - ${recipientName || 'Noma\'lum'}`,
      recipientName: recipientName || '',
      recipientPhone: recipientPhone || '',
      type: 'partial' as 'partial', // Qisman to'lov ekanligini belgilash
    };
    
    debt.payments.push(partialPayment);
    debt.paidAmount += amount;
    debt.remainingAmount -= amount;
    
    if (debt.remainingAmount === 0) {
      debt.status = 'paid';
    }
    
    await debt.save();
    res.json({ 
      success: true, 
      data: debt,
      message: `${amount.toLocaleString()} so'm qisman to'lov qilindi`
    });
  } catch (error) {
    console.error('Partial pay my debt error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Qarzni o'chirish
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await MyDebt.findByIdAndDelete(id);
    res.json({ success: true, message: "Qarz o'chirildi" });
  } catch (error) {
    console.error('Delete my debt error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Bitta qarzni olish
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const debt = await MyDebt.findById(id);
    if (!debt) {
      return res.status(404).json({ success: false, message: 'Qarz topilmadi' });
    }
    res.json({ success: true, data: debt });
  } catch (error) {
    console.error('Get my debt error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
