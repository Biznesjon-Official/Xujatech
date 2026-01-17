import { Router, Request, Response } from 'express';
import { Sale, Product, Customer } from '../models';
import mongoose from 'mongoose';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all sales
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status, customerId, cashierId } = req.query;
    
    const filter: any = {};
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (cashierId) filter.cashierId = cashierId;

    const sales = await Sale.find(filter)
      .populate('customerId', 'fullName phone')
      .populate('cashierId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get sale by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customerId', 'fullName phone')
      .populate('cashierId', 'fullName');
    
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sotuv topilmadi' });
    }

    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Create sale
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customerId, items, payments, discountAmount, notes } = req.body;
    const cashierId = (req as any).user?.userId || (req as any).user?.id;
    
    if (!cashierId) {
      throw new Error('Kassir aniqlanmadi. Qayta login qiling.');
    }

    // Calculate totals
    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      
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

      // Update stock
      product.currentStock -= item.quantity;
      await product.save({ session });
    }

    const totalAmount = subtotal - (discountAmount || 0);
    const paidAmount = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const changeAmount = Math.max(0, paidAmount - totalAmount);

    // Check if debt payment
    const hasDebtPayment = payments.some((p: any) => p.method === 'debt');
    if (hasDebtPayment && customerId) {
      const debtAmount = payments.find((p: any) => p.method === 'debt')?.amount || 0;
      await Customer.findByIdAndUpdate(
        customerId,
        { $inc: { currentDebt: debtAmount, totalPurchases: totalAmount } },
        { session }
      );
    } else if (customerId) {
      await Customer.findByIdAndUpdate(
        customerId,
        { $inc: { totalPurchases: totalAmount } },
        { session }
      );
    }

    const sale = new Sale({
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
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Create sale error:', error);
    res.status(400).json({ success: false, message: error.message || 'Sotuv yaratishda xatolik' });
  } finally {
    session.endSession();
  }
});

// Cancel/Refund sale
router.post('/:id/cancel', authenticateToken, async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sale = await Sale.findById(req.params.id).session(session);
    
    if (!sale) {
      throw new Error('Sotuv topilmadi');
    }

    if (sale.status !== 'completed') {
      throw new Error('Faqat yakunlangan sotuvni bekor qilish mumkin');
    }

    // Restore stock
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { currentStock: item.quantity } },
        { session }
      );
    }

    // Restore customer debt if applicable
    const debtPayment = sale.payments.find(p => p.method === 'debt');
    if (debtPayment && sale.customerId) {
      await Customer.findByIdAndUpdate(
        sale.customerId,
        { $inc: { currentDebt: -debtPayment.amount, totalPurchases: -sale.totalAmount } },
        { session }
      );
    }

    sale.status = 'cancelled';
    await sale.save({ session });
    await session.commitTransaction();

    res.json({ success: true, data: sale });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

export default router;
