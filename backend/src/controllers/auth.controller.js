import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {db} from '../config/db.js';

export const login = async (req, res) => {
    try {
        const {email, password} = req.body || {};
        
        if (!email || ! password){
            return res.status(400).json({message: 'Email and password are required'});
        }

        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user || !user.is_active) {
            return res.status(401).json({ message: 'Invalid email or password'});
        } else if (!await bcrypt.compare(password, user.password_hash)) {
            return res.status(401).json({ message: 'Invalid email or password'});
        } 
        await db.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

        const token = jwt.sign(
            { id: user.id, role: user.acc_role},
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN}
        );

        res.json({
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.acc_role,
            },
        });
    } catch (err){
        console.error(err);
        res.status(500).json({ message: 'Server error'});
    }
}