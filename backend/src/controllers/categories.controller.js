import { db } from '../config/db.js';

export const getCategories = async(req, res) => {
    try {
        const [rows] = await db.query('SELECT id, category_name FROM categories ORDER BY category_name');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error'});
    }
};

export const getCategoryByID = async(req, res) => {
    const { id } = req.params;
    try {
        const [categoryRows] = await db.query(`
            SELECT * FROM categories
            WHERE id = ?
        `, [id]);

        const category = categoryRows[0];

        if(!category){
            return res.status(404).json({ message: 'Category not found '});
        }

        const [products] = await db.query(`
            SELECT * FROM products
            WHERE category_id = ?
        `, [id]);

        res.json({category, products});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error'});
    }
};

export const createCategory = async (req, res) => {
    const {name} = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.query(`
            INSERT INTO categories (category_name)
            VALUES(?)
        `, [name]);
        
        const categoryId = result.insertId;

        await conn.commit();
        res.status(201).json({ message: 'Category created', id: categoryId});
    } catch (err) { 
        await conn.rollback();
        if(err.code === 'ER_DUP_ENTRY'){
            if(err.sqlMessage.includes('category_name')){
                return res.status(409).json({ message: 'A category with this name already exists' });
            }
        }
        console.error(err);
        res.status(500).json({ message: 'Server error'});
    } finally {
        conn.release();
    }
};

export const updateCategory = async (req, res) => {
    try {
        const {name} = req.body;

        const [result] = await db.query(`
            UPDATE categories
            SET category_name = ?
            WHERE id = ?
        `, [name, req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category updated'});
    } catch(err){
        console.error(err);
        if(err.code === 'ER_DUP_ENTRY'){
            return res.status(404).json({ message: 'Category name already exists' });
        }
        res.status(500).json({ message: "Server Error" });
    };
};

export const deleteCategory = async(req, res) => {
    try{
        const [result] = await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found'});
        }
        res.json({ message: 'Category deleted' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2'){
            return res.status(409).json({
                message: 'This category has order and cannot be deleted. Deactivate it instead.',
            });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error'});
    }
};