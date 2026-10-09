import { Router } from 'express';
import adminRoutes from './AdminRoutes';
import authRoutes from './authRoutes';
import collectionRoutes from './CollectionRoutes';
import comparisonRoutes from './ComparisonRoutes';
import favouriteRoutes from './FavouriteRoutes';
import guesthouseRoutes from './guesthouseRoutes';
import ratingRoutes from './RatingRoutes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/guesthouses', guesthouseRoutes);

// Customer interaction module
router.use('/ratings', ratingRoutes);
router.use('/favourites', favouriteRoutes);
router.use('/collections', collectionRoutes);
router.use('/comparisons', comparisonRoutes);

export default router;
