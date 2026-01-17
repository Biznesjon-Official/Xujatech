"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
router.get('/receipt', async (req, res) => {
    try {
        const keys = ['storeName', 'storeAddress', 'storePhone', 'headerText', 'footerText', 'showLogo', 'showBarcode', 'paperWidth'];
        const settings = await models_1.Setting.find({ key: { $in: keys } });
        const data = {
            storeName: 'XUJATECH Store',
            storeAddress: '',
            storePhone: '',
            headerText: '',
            footerText: 'Xaridingiz uchun rahmat!',
            showLogo: true,
            showBarcode: true,
            paperWidth: 80
        };
        settings.forEach(s => {
            if (s.value === 'true')
                data[s.key] = true;
            else if (s.value === 'false')
                data[s.key] = false;
            else if (!isNaN(Number(s.value)))
                data[s.key] = Number(s.value);
            else
                data[s.key] = s.value;
        });
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.put('/receipt', async (req, res) => {
    try {
        const updates = req.body;
        for (const [key, value] of Object.entries(updates)) {
            await models_1.Setting.findOneAndUpdate({ key }, { value: String(value) }, { upsert: true });
        }
        res.json({ success: true, message: 'Sozlamalar saqlandi' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/', async (req, res) => {
    try {
        const settings = await models_1.Setting.find();
        const data = {};
        settings.forEach(s => {
            data[s.key] = s.value;
        });
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.get('/:key', async (req, res) => {
    try {
        const setting = await models_1.Setting.findOne({ key: req.params.key });
        if (!setting) {
            return res.status(404).json({ success: false, message: 'Sozlama topilmadi' });
        }
        res.json({ success: true, data: setting });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
router.put('/:key', async (req, res) => {
    try {
        const { value } = req.body;
        const setting = await models_1.Setting.findOneAndUpdate({ key: req.params.key }, { value }, { new: true, upsert: true });
        res.json({ success: true, data: setting });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
exports.default = router;
//# sourceMappingURL=settings.js.map