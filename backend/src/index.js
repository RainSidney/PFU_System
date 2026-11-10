import express from 'express';
import mysql from 'mysql2/promise';
import 'dotenv/config';
import {db} from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/products.routes.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.get('/api/health', (req, res) => {
    res.json({status: 'ok'});
})

app.get('/api/db-test', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.json(rows);
    } catch (err) {
        console.error(err)
        res.status(500).json({error: 'Database connection failed' });
    }
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});