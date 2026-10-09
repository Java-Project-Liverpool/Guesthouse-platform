import type { Request, Response } from 'express';
import Guesthouse from '../models/Guesthouse';
import Rating from '../models/Rating';
import User from '../models/User';

export async function getDashboard(_req: Request, res: Response) {
  const [totalUsers, totalAdmins, totalCustomers, totalGuesthouses, totalRatings] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'customer' }),
    Guesthouse.countDocuments({ isActive: true }),
    Rating.countDocuments(),
  ]);

  res.json({
    stats: {
      totalUsers,
      totalAdmins,
      totalCustomers,
      totalGuesthouses,
      totalRatings,
    },
  });
}
