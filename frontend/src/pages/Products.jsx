import { useEffect, useState } from "react";
import api from '../api/axios';
import ProductModal from "../components/ProductModal";

const formatPrice = (value) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);

const renderStatusBadge = (stock) => {
    const qty = Number(stock);
    
    if(qty === 0){
        return <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">Out of stock</span>;
    } else if (qty <=10 ) {
        return <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">Low stock</span>;
    } else {
        return <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">In stock</span>;
    }
};

const getUserRole = () => {
    const directRole = localStorage.getItem('role');
    if(directRole) return directRole.toLowerCase();

    try{
        const parsedUser = JSON.parse(localStorage.getItem('user') || 'null');
        return (parsedUser?.role || '').toLowerCase();
    } catch {
        return '';
    }
}

export default function Products(){
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const isAdmin = getUserRole() === 'admin';

    const loadProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProdcuts();
    }, []);

    const handleDelete = async (product) => {
        if(!window.confirm(`Delete "${product.product_name}"$`)) return;

        try {
            await api.delete(`/products/${product.id}`);
            loadProdcuts();
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed');
        }
    };

    const filtered = products.filter((p) =>
        p.product_name.toLowerCase().includes(search.toLowerCase())
    );

    if(loading) return <p className="p-6">Loading products...</p>;
    if(error) return <p classnName="p-6 text-red-600">{error}</p>;

    return(
        <div className="p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Products/Inventory</h1>
                    <p className="text-gray-500">Product Management Status</p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setEditing(null);
                        setModalOpen(true);
                    }}
                    className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    + Add Product
                </button>
            </div>

            <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="mb-4 w-full rounded border p-2"
            />

            <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="p-3">Product</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Price</th>
                            <th className="p-3">Total Stock</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? (
                            filtered.map((p) => (
                                <tr key={p.id} className="border-t">
                                    <td className="p-3 font-medium">{p.product_name}</td>
                                    <td className="p-3">{p.category_name || 'Uncategorized'}</td>
                                    <td className="p-3">{formatPrice(p.price)}</td>
                                    <td className="p-3">{p.total_stock}</td>
                                    <td className="p-3">{renderStatusBadge(p.total_stock)}</td>
                                    <td className="p-3 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditing(p);
                                                    setModalOpen(true);
                                                }}
                                                className="rounded border px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                            >
                                                Edit
                                            </button>

                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(p)}
                                                    className="rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                                                >
                                                    Delete
                                                </button>
                                            )} 
                                        </div>
                                    </td>
                                </tr> 
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="p-6 text-center text-gray-500">
                                No Products found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {modalOpen && (
                <ProductModal
                    product={editing}
                    onClose={() => {
                        setModalOpen(false);
                        setEditing(null);
                        loadProducts();
                    }}
                    onSaved={() => {
                        setModalOpen(false);
                        setEditing(null);
                        loadProducts();
                    }}
                />
            )}  
        </div>
    );
}