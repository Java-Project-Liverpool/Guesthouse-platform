import { Router } from 'express';
import {
  createRating,
  deleteRating,
  listMyRatings,
  updateRating,
} from '../controllers/ratingController';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Only authenticated customers. Ownership of :id is checked inside the controller.
router.use(requireAuth, requireRole('customer'));

router.get('/mine', asyncHandler(listMyRatings));
router.post('/', asyncHandler(createRating));
router.put('/:id', asyncHandler(updateRating));
router.delete('/:id', asyncHandler(deleteRating));

export default router;
