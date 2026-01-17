/**
 * Warehouse Products Routes
 * Ombordagi mahsulotlar uchun API endpointlari
 */

import express, { Response } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';
import { authenticateToken, requireManager, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import WarehouseProduct from '../models/WarehouseProduct';

const router = express.Router();

// Validation schemas
const productValidation = Joi.object({
  barcode: Joi.string().allow(''),
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(500).allow(''),
  categoryId: Joi.string().allow('', null),
  purchasePrice: Joi.number().min(0).default(0),
  sellingPrice: Joi.number().min(0).required(),
  warehouseStock: Joi.number().integer().default(0),
  minimumStock: Joi.number().integer().min(0).default(5),
  unit: Joi.string().default('dona')
});

// ==================== WAREHOUSE PRODUCTS CRUD ====================

// Get all warehouse products
router.get('/products', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const products = await WarehouseProduct.find({ isActive: true })
    .populate('categoryId', 'name')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: products
  });
}));

// Create warehouse product
router.post('/products', authenticateToken, requireManager, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { error, value } = productValidation.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  // Check if barcode already exists
  if (value.barcode) {
    const existing = await WarehouseProduct.findOne({ barcode: value.barcode, isActive: true });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Bu shtrix-kod allaqachon mavjud'
      });
    }
  }

  const product = new WarehouseProduct({
    ...value,
    categoryId: value.categoryId || undefined
  });
  
  await product.save();
  logger.info(`Warehouse product ${value.name} created by ${req.user!.username}`);

  res.status(201).json({
    success: true,
    message: 'Mahsulot omborga qo\'shildi',
    data: { id: product._id }
  });
}));

// Get warehouse product by ID
router.get('/products/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await WarehouseProduct.findById(req.params.id).populate('categoryId', 'name');

  if (!product || !product.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Mahsulot topilmadi'
    });
  }

  res.json({
    success: true,
    data: product
  });
}));

// Update warehouse product
router.put('/products/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { error, value } = productValidation.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  const product = await WarehouseProduct.findById(req.params.id);
  if (!product || !product.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Mahsulot topilmadi'
    });
  }

  // Check if barcode already exists (excluding current product)
  if (value.barcode) {
    const existing = await WarehouseProduct.findOne({ 
      barcode: value.barcode, 
      isActive: true,
      _id: { $ne: req.params.id }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Bu shtrix-kod allaqachon mavjud'
      });
    }
  }

  Object.assign(product, {
    ...value,
    categoryId: value.categoryId || undefined,
    updatedAt: new Date()
  });
  
  await product.save();
  logger.info(`Warehouse product ${value.name} updated by ${req.user!.username}`);

  res.json({
    success: true,
    message: 'Mahsulot yangilandi',
    data: product
  });
}));

// Delete warehouse product (soft delete)
router.delete('/products/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await WarehouseProduct.findById(req.params.id);
  if (!product || !product.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Mahsulot topilmadi'
    });
  }

  product.isActive = false;
  await product.save();
  
  logger.info(`Warehouse product ${product.name} deleted by ${req.user!.username}`);

  res.json({
    success: true,
    message: 'Mahsulot o\'chirildi'
  });
}));

// Search warehouse products by barcode
router.get('/products/search/barcode/:barcode', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await WarehouseProduct.findOne({ 
    barcode: req.params.barcode, 
    isActive: true 
  }).populate('categoryId', 'name');

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Mahsulot topilmadi'
    });
  }

  res.json({
    success: true,
    data: product
  });
}));

export default router;
