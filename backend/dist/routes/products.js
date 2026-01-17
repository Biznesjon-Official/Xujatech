"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { search, categoryId, isActive } = req.query;
        const filter = { isActive: true };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }
        if (categoryId)
            filter.categoryId = categoryId;
        if (isActive !== undefined)
            filter.isActive = isActive === 'true';
        const products = await models_1.Product.find(filter)
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: products });
    }
    catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const product = await models_1.Product.findById(req.params.id).populate('categoryId', 'name');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Mahsulot topilmadi' });
        }
        res.json({ success: true, data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/barcode/:barcode', async (req, res) => {
    try {
        const barcode = req.params.barcode.trim();
        console.log('🔍 Shtrix-kod qidirilmoqda:', barcode);
        const searchVariants = [barcode];
        if (/^\d{14}$/.test(barcode) && barcode.startsWith('0')) {
            searchVariants.push(barcode.substring(1));
        }
        if (/^\d{13}$/.test(barcode)) {
            searchVariants.push('0' + barcode);
        }
        const noZeros = barcode.replace(/^0+/, '');
        if (noZeros !== barcode && noZeros.length >= 6) {
            searchVariants.push(noZeros);
        }
        console.log('🔎 Qidiruv variantlari:', searchVariants);
        const product = await models_1.Product.findOne({
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
    }
    catch (error) {
        console.error('❌ Shtrix-kod qidirish xatosi:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.post('/', async (req, res) => {
    try {
        const productData = { ...req.body };
        if (productData.categoryId === null || productData.categoryId === '') {
            delete productData.categoryId;
        }
        if (!productData.barcode) {
            const lastProduct = await models_1.Product.findOne().sort({ createdAt: -1 });
            const lastCode = lastProduct?.barcode ? parseInt(lastProduct.barcode) : 0;
            productData.barcode = String(isNaN(lastCode) ? 1 : lastCode + 1);
        }
        const product = new models_1.Product(productData);
        await product.save();
        res.status(201).json({ success: true, data: product });
    }
    catch (error) {
        console.error('Create product error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Kod allaqachon mavjud' });
        }
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const product = await models_1.Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Mahsulot topilmadi' });
        }
        res.json({ success: true, data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const product = await models_1.Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Mahsulot topilmadi' });
        }
        res.json({ success: true, message: 'Mahsulot o\'chirildi' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map