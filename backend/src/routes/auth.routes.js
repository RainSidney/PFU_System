import { Router } from 'express';
import { login }  from '../controllers/auth.controller.js';
import { verifyToken, adminOnly } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);

router.get('/me', verifyToken, (req, res) => {
    res.json({ message: 'You are logged in', user: req.user });
});

router.get('/admin-test', verifyToken, adminOnly, (req, res) => {
    res.json({ message: 'Welcome, admin'});
});

export default router;