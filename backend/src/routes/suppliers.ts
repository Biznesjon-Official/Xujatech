import { Router, Request, Response } from 'express';
import { Supplier } from '../models';

const router = Router();

// Get all suppliers
router.get('/', async (req: Request, res: Response) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get supplier by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Ta\'minotchi topilmadi' });
    }

    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Create supplier
router.post('/', async (req: Request, res: Response) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Update supplier
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Ta\'minotchi topilmadi' });
    }

    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Delete supplier
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Supplier.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Ta\'minotchi o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
