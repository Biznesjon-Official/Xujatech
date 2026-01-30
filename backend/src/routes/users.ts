import { Router, Request, Response } from 'express';
import { User } from '../models';

const router = Router();

// Get cashiers only (optimized for home page)
router.get('/cashiers', async (req: Request, res: Response) => {
  try {
    const cashiers = await User.find({ 
      isActive: true, 
      role: 'cashier' 
    })
      .select('_id fullName username')
      .sort({ fullName: 1 })
      .lean(); // Use lean() for better performance

    res.json({ success: true, data: cashiers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ fullName: 1 });

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Create user
router.post('/', async (req: Request, res: Response) => {
  try {
    const { username, password, fullName, email, phone, role } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Bu username allaqachon mavjud' });
    }

    const user = new User({ username, password, fullName, email, phone, role });
    await user.save();

    const userData = user.toObject();
    delete (userData as any).password;

    res.status(201).json({ success: true, data: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Update user
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { password, ...updateData } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    }

    // Update fields
    Object.assign(user, updateData);

    // Update password if provided
    if (password && password.trim()) {
      user.password = password;
    }

    await user.save();

    const userData = user.toObject();
    delete (userData as any).password;

    res.json({ success: true, data: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Change password
router.put('/:id/password', async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Parol o\'zgartirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Delete user
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Foydalanuvchi o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
