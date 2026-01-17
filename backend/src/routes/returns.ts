import express from 'express';
import Return from '../models/Return';
import { Product } from '../models';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Barcha qaytarishlarni olish
router.get('/', authenticateToken, async (req, res) => {
  try {
    const returns = await Return.find().sort({ createdAt: -1 });
    res.json({ success: true, data: returns });
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Yangi qaytarish yaratish
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items, totalAmount, reason, customerName, customerPhone, notes, saleId } = req.body;
    
    const newReturn = new Return({
      saleId,
      items,
      totalAmount,
      reason,
      status: 'pending',
      customerName,
      customerPhone,
      notes,
      createdBy: (req as any).user?.id,
    });
    
    await newReturn.save();
    res.json({ success: true, data: newReturn });
  } catch (error) {
    console.error('Create return error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Qaytarishni tasdiqlash - mahsulotlarni omborga qaytarish
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Qaytarish topilmadi' });
    }
    
    if (returnDoc.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Bu qaytarish allaqachon ko\'rib chiqilgan' });
    }
    
    // Mahsulotlarni omborga qaytarish
    for (const item of returnDoc.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
    }
    
    returnDoc.status = 'approved';
    returnDoc.approvedBy = (req as any).user?.id;
    returnDoc.approvedAt = new Date();
    await returnDoc.save();
    
    res.json({ success: true, data: returnDoc });
  } catch (error) {
    console.error('Approve return error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Qaytarishni rad etish
router.post('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Qaytarish topilmadi' });
    }
    
    if (returnDoc.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Bu qaytarish allaqachon ko\'rib chiqilgan' });
    }
    
    returnDoc.status = 'rejected';
    await returnDoc.save();
    
    res.json({ success: true, data: returnDoc });
  } catch (error) {
    console.error('Reject return error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Qaytarishni o'chirish
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Qaytarish topilmadi' });
    }
    
    // Agar tasdiqlangan bo'lsa, mahsulotlarni qaytarib olish
    if (returnDoc.status === 'approved') {
      for (const item of returnDoc.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity }
        });
      }
    }
    
    await Return.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Qaytarish o\'chirildi' });
  } catch (error) {
    console.error('Delete return error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
