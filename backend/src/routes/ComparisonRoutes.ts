import { Router } from 'express';
import {
  addGuesthouseToComparison,
  createComparison,
  deleteComparison,
  getComparison,
  listComparisons,
  removeGuesthouseFromComparison,
} from '../controllers/comparisonController';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth, requireRole('customer'));

router.get('/', asyncHandler(listComparisons));
router.post('/', asyncHandler(createComparison));
router.get('/:id', asyncHandler(getComparison));
router.delete('/:id', asyncHandler(deleteComparison));
router.post('/:id/guesthouses', asyncHandler(addGuesthouseToComparison));
router.delete('/:id/guesthouses/:guesthouseId', asyncHandler(removeGuesthouseFromComparison));

export default router;
