import { Router, Request, Response } from 'express';
import { Product } from '../models';

const router = Router();

// Get inventory stock
router.get('/stock', async (req: Request, res: Response) => {
  try {
    const { lowStock } = req.query;
    
    let filter: any = { isActive: true };
    
    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$currentStock', '$minimumStock'] };
    }

    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .sort({ currentStock: 1 });

    const data = products.map(p => ({
      id: p._id,
      name: p.name,
      barcode: p.barcode,
      current_stock: p.currentStock,
      minimum_stock: p.minimumStock,
      category_name: (p.categoryId as any)?.name || ''
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Stock adjustment
router.post('/adjust', async (req: Request, res: Response) => {
  try {
    const { productId, quantity, type, reason } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Mahsulot topilmadi' });
    }

    if (type === 'in') {
      product.currentStock += quantity;
    } else if (type === 'out') {
      if (product.currentStock < quantity) {
        return res.status(400).json({ success: false, message: 'Yetarli mahsulot yo\'q' });
      }
      product.currentStock -= quantity;
    } else {
      product.currentStock = quantity; // Set exact amount
    }

    await product.save();

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
