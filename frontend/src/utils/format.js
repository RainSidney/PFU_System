export const formatPrice = (value) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(Number(value) || 0);

export const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-blue-100 text-blue-700',
    packed: 'bg-indigo-100 text-indigo-700',
    shipped: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
};