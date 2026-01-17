import { Router, Request, Response } from 'express';
import { Setting } from '../models';

const router = Router();

// Receipt settings - must be before /:key to avoid being caught by it
router.get('/receipt', async (req: Request, res: Response) => {
  try {
    const keys = ['storeName', 'storeAddress', 'storePhone', 'headerText', 'footerText', 'showLogo', 'showBarcode', 'paperWidth'];
    const settings = await Setting.find({ key: { $in: keys } });
    
    const data: any = {
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
      if (s.value === 'true') data[s.key] = true;
      else if (s.value === 'false') data[s.key] = false;
      else if (!isNaN(Number(s.value))) data[s.key] = Number(s.value);
      else data[s.key] = s.value;
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Update receipt settings - must be before /:key
router.put('/receipt', async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    
    for (const [key, value] of Object.entries(updates)) {
      await Setting.findOneAndUpdate(
        { key },
        { value: String(value) },
        { upsert: true }
      );
    }

    res.json({ success: true, message: 'Sozlamalar saqlandi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get all settings
router.get('/', async (req: Request, res: Response) => {
  try {
    const settings = await Setting.find();
    
    const data: any = {};
    settings.forEach(s => {
      data[s.key] = s.value;
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get setting by key
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Sozlama topilmadi' });
    }

    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Update setting
router.put('/:key', async (req: Request, res: Response) => {
  try {
    const { value } = req.body;
    
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { value },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
