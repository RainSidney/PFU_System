import { useEffect, useState } from 'react';
import api from '../api/axios';
import { formatPrice, statusStyles } from '../utils/format';
import OrderDetailModal from '../components/OrderDetailModal';

const STATUSES = ['pending', 'paid', 'packed', 'shipped', 'completed', 'cancelled'];

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    const loadOrders = async (activeStatus = statusFilter) => {
        try {
            setError('');
            const params = activeStatus && activeStatus !== 'all' ? { status: activeStatus } : {};
            const res = await api.get('/orders', { params });
            setOrders(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders(statusFilter);
    }, [statusFilter]);

    if (loading) return <p className="p-6">Loading orders...</p>;
    if (error) return <p className="p-6 text-red-600">{error}</p>;

    return (
        <div className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Orders</h1>
                    <p className="text-gray-500">Order fulfillment and status management</p>
                </div>

                <div className="flex items-center gap-2">
                    <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">
                        Status:
                    </label>
                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded border bg-white px-3 py-1.5 text-sm"
                    >
                        <option value="all">All</option>
                        {STATUSES.map((s) => (
                            <option key={s} value={s} className="capitalize">
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="p-3">Order #</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Items</th>
                            <th className="p-3">Total</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length > 0 ? (
                            orders.map((o) => (
                                <tr key={o.id} className="border-t hover:bg-gray-50">
                                    <td className="p-3 font-medium">#{o.id}</td>
                                    <td className="p-3">{o.customer_name}</td>
                                    <td className="p-3">
                                        {o.created_at ? new Date(o.created_at).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="p-3">{o.item_lines}</td>
                                    <td className="p-3">{formatPrice(o.total_amount)}</td>
                                    <td className="p-3">
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs capitalize ${
                                                statusStyles[o.status] || 'bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedOrderId(o.id)}
                                            className="rounded border px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="p-6 text-center text-gray-500">
                                    No orders found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedOrderId && (
                <OrderDetailModal
                    orderId={selectedOrderId}
                    onClose={() => setSelectedOrderId(null)}
                    onUpdated={() => loadOrders(statusFilter)}
                />
            )}
        </div>
    );
}