import { useEffect, useState } from 'react';
import api from '../api/axios';
import { formatPrice, statusStyles } from '../utils/format';

const NEXT = {
    pending: ['paid', 'cancelled'],
    paid: ['packed', 'cancelled'],
    packed: ['shipped', 'cancelled'],
    shipped: ['completed'],
    completed: [],
    cancelled: [],
};

const actionButtonStyle = (nextStatus) => {
    if (nextStatus === 'cancelled') {
        return 'bg-red-600 text-white hover:bg-red-700';
    }
    if (nextStatus === 'completed') {
        return 'bg-green-600 text-white hover:bg-green-700';
    }
    return 'bg-blue-600 text-white hover:bg-blue-700';
};

export default function OrderDetailModal({ orderId, onClose, onUpdated }) {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchOrderDetail = async () => {
        try {
            setError('');
            const res = await api.get(`/orders/${orderId}`);
            setOrder(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!orderId) return;
        setLoading(true);
        fetchOrderDetail();
    }, [orderId]);

    const changeStatus = async (newStatus) => {
        if (newStatus === 'cancelled') {
            const confirmed = window.confirm('Cancel this order? Stock will be restored.');
            if (!confirmed) return;
        }

        setSubmitting(true);
        setError('');
        try {
            await api.patch(`/orders/${order.id}/status`, { status: newStatus });
            await fetchOrderDetail();
            if (onUpdated) {
                await onUpdated();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update status');
        } finally {
            setSubmitting(false);
        }
    };

    const items = order?.items || [];
    const computedSubtotal = items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
        0
    );
    const nextActions = order ? NEXT[order.status] || [] : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
                <div className="mb-4 flex items-center justify-between border-b pb-3">
                    <div>
                        <h2 className="text-xl font-bold">
                            Order {order ? `#${order.id}` : `#${orderId}`}
                        </h2>
                        {order?.created_at && (
                            <p className="text-xs text-gray-500">
                                Placed on {new Date(order.created_at).toLocaleDateString()}
                            </p>
                        )}
                    </div>

                    {order && (
                        <span
                            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                                statusStyles[order.status] || 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            {order.status}
                        </span>
                    )}
                </div>

                {error && (
                    <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {loading ? (
                    <p className="py-6 text-sm text-gray-500">Loading order details...</p>
                ) : !order ? (
                    <p className="py-6 text-sm text-gray-500">Order not found.</p>
                ) : (
                    <div className="space-y-5">
                        {/* Customer & Shipping Info */}
                        <div className="rounded border bg-gray-50 p-3 text-sm">
                            <h3 className="mb-1 font-semibold text-gray-800">Customer & Shipping</h3>
                            <p className="text-gray-700">
                                <span className="font-medium">Name:</span> {order.customer_name || '-'}
                            </p>
                            <p className="text-gray-700">
                                <span className="font-medium">Contact:</span>{' '}
                                {order.customer_phone || order.customer_email || '-'}
                            </p>
                            <p className="text-gray-700">
                                <span className="font-medium">Shipping Address:</span>{' '}
                                {order.shipping_address || order.address || '-'}
                            </p>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto rounded border">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="p-2.5">Product</th>
                                        <th className="p-2.5">Size / Color</th>
                                        <th className="p-2.5">Qty</th>
                                        <th className="p-2.5">Unit Price</th>
                                        <th className="p-2.5 text-right">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length > 0 ? (
                                        items.map((item) => {
                                            const lineTotal =
                                                Number(item.quantity) * Number(item.unit_price);
                                            return (
                                                <tr key={item.id} className="border-t">
                                                    <td className="p-2.5 font-medium">
                                                        {item.product_name}
                                                        {item.sku && (
                                                            <span className="ml-1.5 text-xs text-gray-400">
                                                                ({item.sku})
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-2.5 text-gray-600">
                                                        {[item.size, item.color].filter(Boolean).join(' / ') || '-'}
                                                    </td>
                                                    <td className="p-2.5">{item.quantity}</td>
                                                    <td className="p-2.5">{formatPrice(item.unit_price)}</td>
                                                    <td className="p-2.5 text-right font-medium">
                                                        {formatPrice(lineTotal)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="p-4 text-center text-gray-500">
                                                No items in this order
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Order Total & Sanity Check */}
                        <div className="flex flex-col items-end space-y-1 border-t pt-3 text-sm">
                            <div className="text-gray-600">
                                Items Subtotal Check:{' '}
                                <span className="font-medium">{formatPrice(computedSubtotal)}</span>
                            </div>
                            <div className="text-base font-bold text-gray-900">
                                Order Total: {formatPrice(order.total_amount)}
                            </div>
                        </div>

                        {/* Workflow Actions & Footer */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                            <div className="flex flex-wrap gap-2">
                                {nextActions.map((nextStatus) => (
                                    <button
                                        key={nextStatus}
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => changeStatus(nextStatus)}
                                        className={`rounded px-3 py-1.5 text-xs font-medium capitalize disabled:opacity-50 ${actionButtonStyle(
                                            nextStatus
                                        )}`}
                                    >
                                        Mark as {nextStatus}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded border px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}