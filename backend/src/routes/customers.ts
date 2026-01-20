import { Router, Request, Response } from 'express';
import { Customer, DebtLog } from '../models';

const router = Router();

// Get all customers
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, hasDebt, createdBy } = req.query;
    
    const filter: any = { isActive: true };
    
    // Kassir bo'yicha filter
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

    const customers = await Customer.find(filter).sort({ fullName: 1 });

    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get customer stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalCustomers = await Customer.countDocuments({ isActive: true });
    const totalDebt = await Customer.aggregate([
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get customer by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Mijoz topilmadi' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Create customer
router.post('/', async (req: Request, res: Response) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Update customer
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Mijoz topilmadi' });
    }

    const previousDebt = customer.currentDebt;
    const newDebt = req.body.currentDebt;

    // Log debt change if debt was edited
    if (newDebt !== undefined && newDebt !== previousDebt && req.body.cashierId) {
      await DebtLog.create({
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Pay debt
router.post('/:id/pay-debt', async (req: Request, res: Response) => {
  try {
    const { amount, cashierId, notes, receivedBy } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Mijoz topilmadi' });
    }

    const previousDebt = customer.currentDebt;
    customer.currentDebt = Math.max(0, customer.currentDebt - amount);

    // Log debt payment
    const paymentNotes = receivedBy 
      ? `${amount} so'm to'landi. Qabul qildi: ${receivedBy}` 
      : notes || `${amount} so'm to'landi`;
    
    await DebtLog.create({
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Add debt (Qarz qo'shish)
router.post('/:id/add-debt', async (req: Request, res: Response) => {
  try {
    const { amount, initialPayment, dueDate, notes, cashierId, guarantor, isInstallment, installmentCount, installmentDates } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Mijoz topilmadi' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Qarz summasi noto\'g\'ri' });
    }

    // Boshlang'ich to'lovni tekshirish
    const initialPaymentAmount = initialPayment || 0;
    if (initialPaymentAmount > amount) {
      return res.status(400).json({ success: false, message: 'Boshlang\'ich to\'lov jami summadan katta bo\'lishi mumkin emas' });
    }

    const previousDebt = customer.currentDebt || 0;
    // Qarz summasi = jami summa - boshlang'ich to'lov
    const finalDebtAmount = amount - initialPaymentAmount;
    customer.currentDebt = previousDebt + finalDebtAmount;
    
    // Muddat belgilash
    if (dueDate) {
      customer.debtDueDate = new Date(dueDate);
    }

    // Bo'lib to'lash (Installment) hisoblash - foydalanuvchi belgilagan sanalar bilan
    let installments: any[] = [];
    if (isInstallment && installmentCount && installmentCount > 1) {
      const installmentAmount = Math.ceil(finalDebtAmount / installmentCount);
      
      for (let i = 0; i < installmentCount; i++) {
        // Foydalanuvchi belgilagan sana yoki default sana
        let installmentDueDate: Date;
        if (installmentDates && installmentDates[i]) {
          installmentDueDate = new Date(installmentDates[i]);
        } else {
          installmentDueDate = new Date();
          installmentDueDate.setMonth(installmentDueDate.getMonth() + i + 1);
        }
        
        // Oxirgi bo'lakda qoldiqni to'g'rilash
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

    // Log debt addition with guarantor and installment info
    const logNotes = initialPaymentAmount > 0 
      ? `${amount} so'm qarz qo'shildi. Boshlang'ich to'lov: ${initialPaymentAmount} so'm. Qoldiq qarz: ${finalDebtAmount} so'm`
      : `${finalDebtAmount} so'm qarz qo'shildi`;

    await DebtLog.create({
      customerId: customer._id,
      cashierId: cashierId || null,
      action: 'added',
      previousAmount: previousDebt,
      newAmount: customer.currentDebt,
      changeAmount: finalDebtAmount,
      notes: notes || logNotes,
      // Kafil ma'lumotlari
      guarantor: guarantor ? {
        fullName: guarantor.fullName,
        phone: guarantor.phone || undefined,
        address: guarantor.address || undefined,
      } : undefined,
      // Bo'lib to'lash
      isInstallment: isInstallment || false,
      installmentCount: installmentCount || undefined,
      installments: installments.length > 0 ? installments : undefined,
      // Boshlang'ich to'lov ma'lumoti
      initialPayment: initialPaymentAmount > 0 ? initialPaymentAmount : undefined,
    });

    // Agar boshlang'ich to'lov bo'lsa, uni alohida log qilish
    if (initialPaymentAmount > 0) {
      await DebtLog.create({
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
  } catch (error) {
    console.error('Add debt error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get all debts with cashier info (Admin panel uchun)
router.get('/debts/all', async (req: Request, res: Response) => {
  try {
    const { User } = await import('../models');
    
    // Faqat qarzlari bor mijozlarni olish
    const customers = await Customer.find({ 
      isActive: true,
      currentDebt: { $gt: 0 }
    }).sort({ currentDebt: -1 });

    // Har bir mijoz uchun oxirgi qarz qo'shgan kassirni topish
    const result = await Promise.all(customers.map(async (customer) => {
      // Oxirgi qarz qo'shgan log
      const lastDebtLog = await DebtLog.findOne({ 
        customerId: customer._id,
        action: 'added'
      }).sort({ createdAt: -1 });

      // Jami to'langan summa
      const paidLogs = await DebtLog.find({
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

      // Status aniqlash
      let status = 'pending';
      if (customer.currentDebt === 0) {
        status = 'paid';
      } else if (customer.debtDueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(customer.debtDueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < today) {
          status = 'overdue';
        } else if (dueDate.getTime() === today.getTime()) {
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
  } catch (error) {
    console.error('Get all debts error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get all debt logs (Barcha qarz tarixi)
router.get('/debt-logs/all', async (req: Request, res: Response) => {
  try {
    const logs = await DebtLog.find()
      .populate('customerId', 'fullName phone')
      .sort({ createdAt: -1 })
      .limit(500);

    const history = logs.map(log => ({
      _id: log._id,
      customerId: log.customerId,
      customerName: (log.customerId as any)?.fullName || 'Noma\'lum',
      customerPhone: (log.customerId as any)?.phone || '',
      action: log.action,
      amount: Math.abs(log.changeAmount),
      previousAmount: log.previousAmount,
      newAmount: log.newAmount,
      notes: log.notes,
      receivedBy: (log as any).receivedBy || null,
      createdAt: log.createdAt,
    }));

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Get all debt logs error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get debt history
router.get('/:id/debt-history', async (req: Request, res: Response) => {
  try {
    const logs = await DebtLog.find({ customerId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);

    // Transform to frontend format (kafil va bo'lib to'lash ma'lumotlari bilan)
    const history = logs.map(log => ({
      type: log.action === 'paid' ? 'payment' : 'debt',
      amount: Math.abs(log.changeAmount),
      createdAt: log.createdAt,
      notes: log.notes,
      receivedBy: (log as any).receivedBy || null,
      guarantor: log.guarantor || null,
      // Bo'lib to'lash ma'lumotlari
      isInstallment: log.isInstallment || false,
      installmentCount: log.installmentCount || null,
      installments: log.installments || [],
    }));

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get debts by cashier (Kassir qo'shgan qarzlar)
router.get('/debts/by-cashier/:cashierId', async (req: Request, res: Response) => {
  try {
    const { cashierId } = req.params;
    
    // Kassir qo'shgan qarzlarni olish
    const debtLogs = await DebtLog.find({ 
      cashierId,
      action: 'added'
    })
    .sort({ createdAt: -1 })
    .limit(100);

    // Mijoz ma'lumotlarini olish
    const customerIds = [...new Set(debtLogs.map(log => log.customerId))];
    const customers = await Customer.find({ _id: { $in: customerIds } });
    const customerMap = new Map(customers.map(c => [c._id.toString(), c]));

    // Qarzlarni formatlash
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
  } catch (error) {
    console.error('Get debts by cashier error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Delete customer debt (reset to 0)
router.post('/:id/delete-debt', async (req: Request, res: Response) => {
  try {
    const { cashierId, notes, debtLogId } = req.body;
    console.log('Delete debt request:', { id: req.params.id, cashierId, notes, debtLogId });
    
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      console.log('Customer not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Mijoz topilmadi' });
    }

    const previousDebt = customer.currentDebt;
    console.log('Previous debt:', previousDebt);

    // Agar debtLogId berilgan bo'lsa, faqat o'sha qarzni o'chirish
    if (debtLogId) {
      const debtLog = await DebtLog.findById(debtLogId);
      if (debtLog && debtLog.action === 'added') {
        const amountToRemove = debtLog.changeAmount;
        customer.currentDebt = Math.max(0, customer.currentDebt - amountToRemove);
        
        // Log deletion
        await DebtLog.create({
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

    // Barcha qarzni o'chirish
    if (previousDebt > 0) {
      await DebtLog.create({
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
  } catch (error) {
    console.error('Delete debt error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Delete customer
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Customer.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Mijoz o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
