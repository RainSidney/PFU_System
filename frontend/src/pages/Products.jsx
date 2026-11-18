import { useEffect, useState } from "react";
import api from '../api/axios';

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
}

export default function Products(){
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try{
                const res = await api.get('/products');
                setProducts(res.data);
                console.log(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load products');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [])

    const filtered = products.filter((p) =>
        p.product_name.toLowerCase().includes(search.toLowerCase())
    );

    if(loading) return <p className="p-6">Loading products...</p>;
    if(error) return <p classnName="p-6 text-red-600">{error}</p>;

    return(
        <div className="p-6">
            <h1 className="text-2xl font-bold">Products/Inventory</h1>
            <p className="text-gray-500">Product Management Status</p>

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
        </div>
    )
}