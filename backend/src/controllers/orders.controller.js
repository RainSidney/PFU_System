import { db } from '../config/db.js';

const TRANSITIONS = {
  pending:   ['paid', 'cancelled'],
  paid:      ['packed', 'cancelled'],
  packed:    ['shipped', 'cancelled'],
  shipped:   ['completed'],
  completed: [],
  cancelled: [],
};

const HOLDS_STOCK = ['paid', 'packed', 'shipped', 'completed'];

export const getOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const values = [];

        let sql = `
            SELECT o.id, o.status, o.total_amount, o.created_at,
                CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                COUNT(oi.id) AS item_lines
            FROM orders o
            JOIN customers c ON c.id = o.customers_id
            LEFT JOIN order_items oi ON oi.order_id = o.id
        `;

        if (status) {
            sql += ` WHERE o.status = ?`;
            values.push(status);
        }

        sql += `
            GROUP BY o.id, c.first_name, c.last_name
            ORDER BY o.created_at DESC
        `;

        const [rows] = await db.query(sql, values);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getOrdersByID = async (req, res) => {
    const { id } = req.params;
    try {
        const [orders] = await db.query(`
            SELECT o.*,
                CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                c.email AS customer_email,
                c.phone AS customer_phone
            FROM orders o
            JOIN customers c ON c.id = o.customers_id
            WHERE o.id = ?
        `, [id]);

        const order = orders[0];

        if (!order) {
            return res.status(404).json({ message: 'Order not found'});
        }

        const [items] = await db.query(`
            SELECT oi.id, oi.quantity, oi.unit_price,
                v.sku, v.size, v.color, p.product_name
            FROM order_items oi
            JOIN product_variants v ON v.id = oi.variant_id
            JOIN products p ON p.id = v.product_id
            WHERE oi.order_id = ?
        `, [id]);
        res.json({ ...order, items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const updateOrderStatus = async (req, res) => {
  const { status: newStatus } = req.body;
  const orderId = req.params.id;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [orders] = await conn.query(
      'SELECT status FROM orders WHERE id = ? FOR UPDATE', [orderId]
    );
    if (orders.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }
    const oldStatus = orders[0].status;

    if (!TRANSITIONS[oldStatus]?.includes(newStatus)) {
        await conn.rollback();
        return res.status(400).json({
            message: `Cannot transition order from '${oldStatus}' to '${newStatus}'`,
        });
    }

    const deduct = !HOLDS_STOCK.includes(oldStatus) && HOLDS_STOCK.includes(newStatus);
    const restore = HOLDS_STOCK.includes(oldStatus) && newStatus === 'cancelled';

    if (deduct || restore) {
      const [items] = await conn.query(`
        SELECT oi.variant_id, oi.quantity, v.sku
        FROM order_items oi
        JOIN product_variants v ON v.id = oi.variant_id
        WHERE oi.order_id = ?`, [orderId]
      );

        for (const item of items) {
            if (deduct) {
                const [result] = await conn.query(
                'UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?',
                [item.quantity, item.variant_id, item.quantity]
                );

                if (result.affectedRows === 0) {
                await conn.rollback();
                return res.status(409).json({
                    message: `Not enough stock for SKU ${item.sku}`,
                });
                }
            } else if (restore) {
                await conn.query(
                'UPDATE product_variants SET stock = stock + ? WHERE id = ?',
                [item.quantity, item.variant_id]
                );
            }
        }
    }

    await conn.query(
      'UPDATE orders SET status = ?, handled_by = ? WHERE id = ?',
      [newStatus, req.user.id, orderId]
    );

    await conn.commit();
    res.json({ message: 'Status updated' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};