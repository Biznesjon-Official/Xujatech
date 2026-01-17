"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const WarehouseProduct_1 = __importDefault(require("../models/WarehouseProduct"));
const router = express_1.default.Router();
const productValidation = joi_1.default.object({
    barcode: joi_1.default.string().allow(''),
    name: joi_1.default.string().min(1).max(200).required(),
    description: joi_1.default.string().max(500).allow(''),
    categoryId: joi_1.default.string().allow('', null),
    purchasePrice: joi_1.default.number().min(0).default(0),
    sellingPrice: joi_1.default.number().min(0).required(),
    warehouseStock: joi_1.default.number().integer().default(0),
    minimumStock: joi_1.default.number().integer().min(0).default(5),
    unit: joi_1.default.string().default('dona')
});
router.get('/products', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const products = await WarehouseProduct_1.default.find({ isActive: true })
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 });
    res.json({
        success: true,
        data: products
    });
}));
router.post('/products', auth_1.authenticateToken, auth_1.requireManager, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { error, value } = productValidation.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    if (value.barcode) {
        const existing = await WarehouseProduct_1.default.findOne({ barcode: value.barcode, isActive: true });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Bu shtrix-kod allaqachon mavjud'
            });
        }
    }
    const product = new WarehouseProduct_1.default({
        ...value,
        categoryId: value.categoryId || undefined
    });
    await product.save();
    logger_1.logger.info(`Warehouse product ${value.name} created by ${req.user.username}`);
    res.status(201).json({
        success: true,
        message: 'Mahsulot omborga qo\'shildi',
        data: { id: product._id }
    });
}));
router.get('/products/:id', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const product = await WarehouseProduct_1.default.findById(req.params.id).populate('categoryId', 'name');
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
router.put('/products/:id', auth_1.authenticateToken, auth_1.requireManager, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { error, value } = productValidation.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    const product = await WarehouseProduct_1.default.findById(req.params.id);
    if (!product || !product.isActive) {
        return res.status(404).json({
            success: false,
            message: 'Mahsulot topilmadi'
        });
    }
    if (value.barcode) {
        const existing = await WarehouseProduct_1.default.findOne({
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
    logger_1.logger.info(`Warehouse product ${value.name} updated by ${req.user.username}`);
    res.json({
        success: true,
        message: 'Mahsulot yangilandi',
        data: product
    });
}));
router.delete('/products/:id', auth_1.authenticateToken, auth_1.requireManager, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const product = await WarehouseProduct_1.default.findById(req.params.id);
    if (!product || !product.isActive) {
        return res.status(404).json({
            success: false,
            message: 'Mahsulot topilmadi'
        });
    }
    product.isActive = false;
    await product.save();
    logger_1.logger.info(`Warehouse product ${product.name} deleted by ${req.user.username}`);
    res.json({
        success: true,
        message: 'Mahsulot o\'chirildi'
    });
}));
router.get('/products/search/barcode/:barcode', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const product = await WarehouseProduct_1.default.findOne({
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
exports.default = router;
//# sourceMappingURL=warehouses.js.map