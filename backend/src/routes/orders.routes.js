import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getOrders, getOrdersByID, updateOrderStatus } from '../controllers/orders.controller.js';
import { validate } from '../middleware/validate.js';
import { statusSchema } from '../validators/order.validator.js';

const router = Router();

router.use(verifyToken);

router.get('/', getOrders);
router.get('/:id', getOrdersByID);
router.patch('/:id/status', validate(statusSchema), updateOrderStatus);

export default router;