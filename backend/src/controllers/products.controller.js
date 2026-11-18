import { db } from '../config/db.js';

export const getProducts = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*,
                c.category_name AS category_name,
                COALESCE(SUM(v.stock), 0) AS total_stock
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN product_variants v ON v.product_id = p.id
            GROUP BY p.id, c.category_name
            ORDER BY p.id DESC
        `);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error '});
    }
};

export const getProductByID = async (req, res) => {
    const { id } = req.params;
    try {
        const [productRows] = await db.query(`
            SELECT p.*, c.category_name AS category_name
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.id = ?
        `, [id]);

        const product = productRows[0];

        if (!product){
            return res.status(404).json({ message: 'Product not found '});
        }

        const [variants] = await db.query(`
            SELECT * FROM product_variants
            WHERE product_id = ?
        `, [id]);

        res.json({ ...product, variants });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error'});
    }
};

export const createProduct = async (req, res) => {
    const { name, category_id, description, image_url, 
        price, available_sizes, available_colors, variants } = req.body || {};     
        
    if (price === undefined){
        return res.status(400).json({ message: 'Price are required' });
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO products
                (product_name, category_id, product_description, image_url, price, sizes, colors)
            VALUES(?, ?, ?, ?, ?, ?, ?)`,
            [name, category_id || null, description || null, image_url || null, price, 
                JSON.stringify(available_sizes || []), JSON.stringify(available_colors || [])]
        );

        const productId = result.insertId;
        
        if (variants && variants.length > 0){
            const rows = variants.map(v => [productId, v.sku, v.size, v.color, v.stock || 0]);
                    await conn.query(
                'INSERT INTO product_variants (product_id, sku, size, color, stock) VALUES ?', [rows]
            );
        }

        await conn.commit();
        res.status(201).json({message: 'Product created', id: productId });
    } catch (err) {
        await conn.rollback();
        if (err.code === 'ER_DUP_ENTRY'){
            if (err.sqlMessage.includes('product_name')){
                return res.status(409).json({ message: 'A product with this name already exists' });
            }
            return res.status(409).json({message: 'SKU already exists'});
        }
        console.error(err);
        res.status(500).json({ message: 'Server error'});
    } finally {
        conn.release();
    }
};  
export const updateProduct = async (req, res) => {
    try {
        const { name, category_id, description, image_url, price, available_sizes, available_colors, is_active } = req.body;

        const [result] = await db.query(`
            UPDATE products 
            SET product_name = ?,
                category_id = ?,
                product_description = ?,
                image_url = ?,
                price = ?,
                sizes = ?,
                colors = ?,
                is_active = ?
            WHERE id  = ?
        `, [name, category_id, description, image_url, price, JSON.stringify(available_sizes), JSON.stringify(available_colors), is_active, req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ message: 'Product updated' });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY'){
            return res.status(409).json({ message: 'Product name already exists'});
        }
        res.status(500).json({ message: 'Server Error' });
    };
};

export const deleteProduct = async(req, res) => {
    try {
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2'){
            return res.status(409).json({
                message: 'This product has order and cannot be deleted. Deactivate it instead.',
            });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error'});
    }
};

export const addVariant = async(req, res) => {
    const {sku, size, color, stock} = req.body || {};

    if (!sku) {
        return res.status(400).json({ message: 'sku is required' });
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();
        
        const [result] = await conn.query(
            `INSERT INTO product_variants
                (product_id, sku, size, color, stock)
            VALUES(?, ?, ?, ?, ?)`,
            [req.params.id, sku, size, color, stock]
        );

        await conn.commit();
        res.status(201).json({ message: 'Variant created'});
    } catch(err) {
        await conn.rollback();
        if (err.code === 'ER_DUP_ENTRY'){
            if(err.sqlMessage.includes('sku')){
                return res.status(409).json({ message: 'A variant with this sku already exists'})
            }
            return res.status(409).json({ message: 'SKU already exists'});
        }
        console.error(err);
        res.status(500).json({ message: 'Server error'});
    } finally {
        conn.release();
    }
};

export const updateVariant = async (req, res) => {
    try{
        const { sku, size, color, stock } = req.body;

        const [result] = await db.query(`
            UPDATE product_variants
            SET sku = ?,
                size = ?,
                color = ?,
                stock = ?
            WHERE id = ?
        `, [sku, size, color, stock, req.params.variantId]);

        if(result.affectedRows === 0) {
            return res.status(404).json({ message: 'Variant not found'});
        }
        res.json({ message: 'Variant updated'});
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY'){
            return res.status(409).json({ message: 'Variant sku already exists'});
        }
        res.status(500).json({ message: 'Server error'});
    };
};

export const deleteVariant = async(req, res) => {
    try{
        const [result] = await db.query('DELETE FROM product_variants WHERE id = ?', [req.params.variantId]);

        if (result.affectedRows === 0){
            return res.status(404).json({ message: 'Variant not found' });
        }
        res.json({ message: 'Variant deleted' });
    } catch (err){
        if (err.code === 'ER_ROW_IS_REFERENCED_2'){
            return res.status(409).json({ message: 'This variant has order and cannot be deleted. Deactivate it instead.',
            });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error'});
    }
};