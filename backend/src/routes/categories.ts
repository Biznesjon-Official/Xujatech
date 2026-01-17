import { Router, Request, Response } from 'express';
import { Category } from '../models';

const router = Router();

// Get all categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('parentId', 'name')
      .sort({ name: 1 });

    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get category by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Kategoriya topilmadi' });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Create category
router.post('/', async (req: Request, res: Response) => {
  try {
    const category = new Category(req.body);
    await category.save();

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Update category
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: 'Kategoriya topilmadi' });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Delete category
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Kategoriya o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
