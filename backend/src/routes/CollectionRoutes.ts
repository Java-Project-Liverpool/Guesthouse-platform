import { Router } from 'express';
import {
  addGuesthouseToCollection,
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  removeGuesthouseFromCollection,
  renameCollection,
} from '../controllers/collectionController';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth, requireRole('customer'));

router.get('/', asyncHandler(listCollections));
router.post('/', asyncHandler(createCollection));
router.get('/:id', asyncHandler(getCollection));
router.put('/:id', asyncHandler(renameCollection));
router.delete('/:id', asyncHandler(deleteCollection));
router.post('/:id/guesthouses', asyncHandler(addGuesthouseToCollection));
router.delete('/:id/guesthouses/:guesthouseId', asyncHandler(removeGuesthouseFromCollection));

export default router;
