import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getProducts, getProductByID, createProduct, updateProduct, deleteProduct} from '../controllers/products.controller.js';
import { validate } from '../middleware/validate.js';
import { adminOnly } from '../middleware/auth.js';
import { createProductSchema, updateProductSchema } from '../validators/product.validator.js';

const router = Router();

router.use(verifyToken);

router.get('/', getProducts);
router.get('/:id', getProductByID);
router.post('/', validate(createProductSchema), createProduct);
router.put('/:id', validate(updateProductSchema), updateProduct);
router.delete('/:id', adminOnly, deleteProduct);

export default router;