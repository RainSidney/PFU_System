import bcrypt from 'bcrypt';
import { db } from '../config/db.js';

const [name, email, password, role] = process.argv.slice(2);

if (!name || !email || !password) {
    console.log('Usage: node src/scripts/createUser.js "Name" email password [role]');
    process.exit(1);
}

const parts = name.trim().split(' ');
const firstName =  parts[0];
const lastName = parts.slice(1).join(' ') || null;
const passwordHash = await bcrypt.hash(password, 10);

await db.query(
    'INSERT INTO users (first_name, last_name, email, password_hash, acc_role) VALUES (?, ?, ?, ?, ?)',
    [firstName, lastName, email, passwordHash, role || 'staff']
);

console.log('User created');
await db.end();