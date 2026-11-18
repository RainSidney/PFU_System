import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getCategories, getCategoryByID, createCategory, updateCategory, deleteCategory } from '../controllers/categories.controller.js';
import { validate } from '../middleware/validate.js';
import { adminOnly } from '../middleware/auth.js';

const router = Router();

router.use(verifyToken);

router.get('/', getCategories);
router.get('/:id', getCategoryByID);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', adminOnly, deleteCategory);

export default router;