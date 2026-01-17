/**
 * Saqlangan cheklar uchun API marshrutlari
 * Mobil kassa rejimi uchun ishlatiladi
 */

import { Router, Request, Response } from 'express';
import { SavedReceipt } from '../models/SavedReceipt';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Barcha saqlangan cheklar ro'yxatini olish
router.get('/saved', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status, source, cashierId } = req.query;
    
    const filter: any = {};
    
    // Standart holatda faqat saqlangan cheklar ko'rsatiladi
    filter.status = status || 'saved';
    
    if (source) filter.source = source;
    if (cashierId) filter.cashierId = cashierId;

    const receipts = await SavedReceipt.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: receipts });
  } catch (error) {
    console.error('Saqlangan cheklar xatosi:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// ID bo'yicha saqlangan chekni olish
router.get('/saved/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const receipt = await SavedReceipt.findById(req.params.id);
    
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Chek topilmadi' });
    }

    res.json({ success: true, data: receipt });
  } catch (error) {
    console.error('Chek olish xatosi:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Saqlangan chek yaratish (mobildan)
router.post('/saved', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      id, // IndexedDB dan ID (sinxronizatsiya uchun)
      cashierId, 
      cashierName, 
      items, 
      total, 
      source, 
      customerId, 
      customerName 
    } = req.body;

    // Bunday localId li chek mavjudligini tekshirish
    if (id) {
      const existing = await SavedReceipt.findOne({ localId: id });
      
      if (existing) {
        return res.json({ success: true, data: existing, message: 'Chek allaqachon mavjud' });
      }
    }

    // Validatsiya
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Mahsulotlar kerak' });
    }

    // Agar yuborilmagan bo'lsa, jami summani hisoblash
    const calculatedTotal = total || items.reduce(
      (sum: number, item: any) => sum + (item.price * item.quantity), 
      0
    );

    const receipt = new SavedReceipt({
      localId: id, // IndexedDB ID ni alohida saqlash
      cashierId: cashierId || (req as any).user?.userId,
      cashierName: cashierName || (req as any).user?.fullName,
      items,
      total: calculatedTotal,
      status: 'saved',
      source: source || 'mobile',
      customerId,
      customerName,
    });

    await receipt.save();

    res.status(201).json({ success: true, data: receipt });
  } catch (error: any) {
    console.error('Chek yaratish xatosi:', error);
    res.status(500).json({ success: false, message: error.message || 'Server xatosi' });
  }
});

// Chek statusini yangilash
router.patch('/saved/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    if (!['saved', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Noto\'g\'ri status' });
    }

    const receipt = await SavedReceipt.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Chek topilmadi' });
    }

    res.json({ success: true, data: receipt });
  } catch (error) {
    console.error('Chek statusini yangilash xatosi:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Saqlangan chekni o'chirish
router.delete('/saved/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const receipt = await SavedReceipt.findByIdAndDelete(req.params.id);

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Chek topilmadi' });
    }

    res.json({ success: true, message: 'Chek o\'chirildi' });
  } catch (error) {
    console.error('Chek o\'chirish xatosi:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Cheklar sinxronizatsiyasi (batch)
router.post('/saved/sync', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { receipts } = req.body;
    
    if (!Array.isArray(receipts)) {
      return res.status(400).json({ success: false, message: 'receipts massiv bo\'lishi kerak' });
    }

    const results = [];
    
    for (const receiptData of receipts) {
      try {
        // localId bo'yicha mavjudligini tekshirish
        const existing = await SavedReceipt.findOne({ localId: receiptData.id });
        
        if (existing) {
          results.push({ id: receiptData.id, status: 'exists' });
          continue;
        }

        const receipt = new SavedReceipt({
          localId: receiptData.id,
          cashierId: receiptData.cashierId || (req as any).user?.userId,
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
      } catch (err: any) {
        results.push({ id: receiptData.id, status: 'error', message: err.message });
      }
    }

    res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Cheklar sinxronizatsiya xatosi:', error);
    res.status(500).json({ success: false, message: error.message || 'Server xatosi' });
  }
});

export default router;
