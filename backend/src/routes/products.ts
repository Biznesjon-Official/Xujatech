import { Router, Request, Response } from 'express';
import { Product, Category } from '../models';

const router = Router();

// Get all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, categoryId, isActive } = req.query;
    
    const filter: any = { isActive: true }; // Faqat aktiv mahsulotlarni ko'rsatish
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (categoryId) filter.categoryId = categoryId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId', 'name');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Mahsulot topilmadi' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get product by barcode
router.get('/barcode/:barcode', async (req: Request, res: Response) => {
  try {
    const barcode = req.params.barcode.trim();
    console.log('🔍 Shtrix-kod qidirilmoqda:', barcode);
    
    // GTIN mosligi uchun qidiruv variantlari
    const searchVariants = [barcode];
    
    // Agar GTIN-14 bo'lsa — EAN-13 qo'shamiz (birinchi 0 siz)
    if (/^\d{14}$/.test(barcode) && barcode.startsWith('0')) {
      searchVariants.push(barcode.substring(1)); // EAN-13
    }
    
    // Agar EAN-13 bo'lsa — GTIN-14 qo'shamiz (boshida 0 bilan)
    if (/^\d{13}$/.test(barcode)) {
      searchVariants.push('0' + barcode); // GTIN-14
    }
    
    // Boshlang'ich nolsiz
    const noZeros = barcode.replace(/^0+/, '');
    if (noZeros !== barcode && noZeros.length >= 6) {
      searchVariants.push(noZeros);
    }
    
    console.log('🔎 Qidiruv variantlari:', searchVariants);
    
    // Barcha variantlar bo'yicha qidirish
    const product = await Product.findOne({ 
      $or: [
        { barcode: { $in: searchVariants } },
        { sku: { $in: searchVariants } },
        { gtin: { $in: searchVariants } }
      ]
    });
    
    console.log('📦 Topilgan mahsulot:', product ? product.name : 'TOPILMADI');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Mahsulot topilmadi' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('❌ Shtrix-kod qidirish xatosi:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Create product
router.post('/', async (req: Request, res: Response) => {
  try {
    // categoryId null bo'lsa, undefined qilish
    const productData = { ...req.body };
    if (productData.categoryId === null || productData.categoryId === '') {
      delete productData.categoryId;
    }
    
    // Avtomatik kod generatsiya qilish (1, 2, 3, ...)
    if (!productData.barcode) {
      const lastProduct = await Product.findOne().sort({ createdAt: -1 });
      const lastCode = lastProduct?.barcode ? parseInt(lastProduct.barcode) : 0;
      productData.barcode = String(isNaN(lastCode) ? 1 : lastCode + 1);
    }
    
    const product = new Product(productData);
    await product.save();

    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    console.error('Create product error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Kod allaqachon mavjud' });
    }
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Update product
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Mahsulot topilmadi' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Delete product
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Mahsulot topilmadi' });
    }

    res.json({ success: true, message: 'Mahsulot o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
