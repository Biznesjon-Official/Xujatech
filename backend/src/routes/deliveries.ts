/**
 * Deliveries Routes - Tovar kelishi
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Delivery, Product, Supplier } from '../models';

const router = Router();

/**
 * Barcha yetkazib berishlarni olish
 * GET /api/deliveries
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, supplierId } = req.query;

    const filter: any = {};

    if (startDate && endDate) {
      filter.deliveryDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    if (supplierId) {
      filter.supplierId = supplierId;
    }

    const deliveries = await Delivery.find(filter)
      .sort({ deliveryDate: -1 })
      .populate('supplierId', 'name phone')
      .populate('items.productId', 'name barcode');

    res.json({ success: true, data: deliveries });
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

/**
 * Bitta yetkazib berishni olish
 * GET /api/deliveries/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('supplierId', 'name phone')
      .populate('items.productId', 'name barcode');

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Topilmadi' });
    }

    res.json({ success: true, data: delivery });
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

/**
 * Yangi yetkazib berish qo'shish
 * POST /api/deliveries
 */
router.post('/', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { supplierName, supplierPhone, items, notes, deliveryDate } = req.body;

    if (!supplierName || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Ta'minotchi nomi va mahsulotlar kerak",
      });
    }

    // Ta'minotchini topish yoki yaratish
    let supplier = await Supplier.findOne({
      name: { $regex: new RegExp(`^${supplierName}$`, 'i') },
    });

    if (!supplier) {
      supplier = await Supplier.create(
        [
          {
            name: supplierName,
            phone: supplierPhone,
            isActive: true,
          },
        ],
        { session }
      ).then((docs) => docs[0]);
    } else if (supplierPhone && supplier.phone !== supplierPhone) {
      supplier.phone = supplierPhone;
      await supplier.save({ session });
    }

    // Mahsulotlarni yangilash va delivery items tayyorlash
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

      // Mahsulotni topish
      const product = await Product.findById(productId).session(session);

      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `Mahsulot topilmadi: ${productId}`,
        });
      }

      // Mahsulot qoldiqini yangilash
      const previousStock = product.currentStock;
      product.currentStock = previousStock + quantity;

      // Agar purchasePrice berilgan bo'lsa, mahsulot narxini yangilash
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

      console.log(
        `📦 ${product.name}: ${previousStock} + ${quantity} = ${product.currentStock}`
      );
    }

    // Delivery yaratish
    const delivery = await Delivery.create(
      [
        {
          supplierId: supplier._id,
          supplierName: supplier.name,
          supplierPhone: supplier.phone,
          items: deliveryItems,
          totalAmount,
          notes,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
        },
      ],
      { session }
    ).then((docs) => docs[0]);

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: delivery,
      message: "Tovar kelishi saqlandi va ombor yangilandi",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create delivery error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  } finally {
    session.endSession();
  }
});

/**
 * Yetkazib berishni o'chirish
 * DELETE /api/deliveries/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const delivery = await Delivery.findById(req.params.id).session(session);

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Topilmadi' });
    }

    // Mahsulot qoldiqlarini qaytarish
    for (const item of delivery.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { currentStock: -item.quantity } },
        { session }
      );
    }

    await Delivery.findByIdAndDelete(req.params.id).session(session);

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Yetkazib berish o'chirildi va ombor yangilandi",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Delete delivery error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  } finally {
    session.endSession();
  }
});

/**
 * Oylik statistika
 * GET /api/deliveries/stats/monthly
 */
router.get('/stats/monthly', async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;

    const now = new Date();
    const targetYear = year ? parseInt(year as string) : now.getFullYear();
    const targetMonth = month ? parseInt(month as string) - 1 : now.getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const stats = await Delivery.aggregate([
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

    // Kunlik statistika
    const dailyStats = await Delivery.aggregate([
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
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
