import { Router, Request, Response } from 'express';
import { Branch } from '../models';

const router = Router();

// Get all branches
router.get('/', async (req: Request, res: Response) => {
  try {
    const branches = await Branch.find().sort({ isMain: -1, createdAt: -1 });
    res.json({ success: true, data: branches });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get branch by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Filial topilmadi' });
    }
    res.json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Create branch
router.post('/', async (req: Request, res: Response) => {
  try {
    const branch = new Branch(req.body);
    await branch.save();
    res.status(201).json({ success: true, data: branch });
  } catch (error: any) {
    console.error('Create branch error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Update branch
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Filial topilmadi' });
    }
    res.json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Delete branch
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Filial topilmadi' });
    }
    res.json({ success: true, message: "Filial o'chirildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
