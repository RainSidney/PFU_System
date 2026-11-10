import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getProducts, getProductByID, createProduct} from '../controllers/products.controller.js';

const router = Router();

router.use(verifyToken);

router.get('/', getProducts);
router.get('/:id', getProductByID);
router.post('/', createProduct);

export default router;