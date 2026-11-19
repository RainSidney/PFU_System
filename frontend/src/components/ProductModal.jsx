import { useState, useEffect } from "react";
import api from '../api/axios';

const emptyForm = {
    name: '',
    category_id: '',
    description: '',
    image_url: '',
    price: '',
    sizes: '',
    colors: '',
    is_active: true,
};

const toList = (val) => {
    if(!val) return '';
    if(Array.isArray(val)) return val.join(', ');
    try{
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed.join(', ') : String(val);
    } catch {
        return String(val);
    }
};

export default function ProductModal({product, onClose, onSaved}) {
    const [form, setForm] = useState(emptyForm);
    const [categories, setCategories] = useState([]);
    const [variants, setVariants] = useState([]);
    const [error, setError] = useState('');
    const [newVariant, setNewVariant] = useState({
        sku: '',
        size: '',
        color: '',
        stock: 0,
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try{
                const res = await api.get('/categories');
                setCategories(res.data);
            } catch(err){
                console.error('Failed to load categories', err)
            }
        }
        fetchCategories();
    }, []);

    useEffect(() => {
        setError('');
        if(!product){
            setForm(emptyForm);
            setVariants([]);
            return;
        }

        const load = async () => {
            try {
                const res = await api.get(`/products/${product.id}`);
                const p = res.data;

                setForm({
                    name: p.product_name,
                    category_id: p.category_id || '',
                    description: p.product_description || '',
                    image_url: p.image_url || '',
                    price: p.price,
                    sizes: toList(p.sizes),
                    colors: toList(p.colors),
                    is_active: Boolean(p.is_active),
                });
                setVariants(p.variants || []);
            } catch (err) {
                console.error('Failed to load product', err);
                setError('Failed to load product datails');
            }
        };

        load();
    }, [product]);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setForm((prev) => ({ ...prev, [name]: value} ));
    };

    const generateVariants = () => {
        const sizes = form.sizes.split(',').map((s) => s.trim()).filter(Boolean);
        const colors = form.colors.split(',').map((c) => c.trim()).filter(Boolean);

        const prefix = form.name
            ? form.name.split(' ').map((w) => w[0]).join('').toUpperCase() : 'PRD';

        const result = [];
        for (const size of sizes){
            for (const color of colors) {
                const sku = `${prefix}-${color.slice(0,3)}-${size}`.toUpperCase();
                result.push({sku, size, color, stock: 0});
            }
        }
        setVariants(result);
    }

    const updateVariant = (index, field, value) => {
        setVariants((prev) =>
            prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const basePayload = {
            name: form.name,
            category_id: form.category_id ? Number(form.category_id) : null, 
            description: form.description || null,
            image_url: form.image_url || null,
            price: Number(form.price),
            available_sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
            available_colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
            is_active: form.is_active,
        };

        const payload = product
            ? basePayload
            : {
                ...basePayload,
                variants: variants.map((v) => ({ ...v, stock: Number(v.stock) })),
            };

        try{
            if (product) {
                await api.put(`/products/${product.id}`, payload);
            } else {
                await api.post('/products', payload);
            }
            onSaved();
        } catch(err) {
            const data = err.response?.data;
            setError(data?.errors?.map((e) => `${e.field}: ${e.message}`).join(',') || data?.message || 'Something went wrong');
        }
    };

    const formatApiError = (err) => {
        const data = err.response?.data;
        return (
            data?.errors?.map((e) => `${e.field}: ${e.message}`).join(', ') || data?.message || 'Something went wrong'
        );
    };

    const reloadProduct = async () => {
        if(!product) return;
        const res = await api.get(`/products/${product.id}`);
        setVariants(res.data.variants || []);
    };

    const handleSaveVariant = async (variant) => {
        setError('');
        try{
            await api.put(`/products/variants/${variant.id}`, {
                sku: variant.sku,
                size: variant.size,
                color: variant.color,
                stock: Number(variant.stock),
            });
        } catch (err) {
            setError(formatApiError(err));
        }
    };

    const handleDeleteVariant = async (variant, index) => {
        setError('');
        try {
            if(variant.id) {
                await api.delete(`/products/variants/${variant.id}`);
            }
            setVariants((prev) => prev.filter((_, i) => i !== index));
        } catch (err){
            setError(formatApiError(err));
        }
    };

    const handleAddVariant = async () => {
        if (!product) return;
        setError('');
        try {
            await api.post(`/products/${product.id}/variants`, {
                sku: newVariant.sku,
                size: newVariant.size || null,
                color: newVariant.color || null,
                stock: Number(newVariant.stock),
            });
            setNewVariant({sku: '', size: '', color: '', stock: 0});
            await reloadProduct();
        } catch (err) {
            setError(formatApiError(err));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
                <h2 className="mb-4 text-xl font-bold">{product ? 'Edit Product' : 'Add Product'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                        <input name="name" value={form.name} onChange={handleChange} placeholder="Product Name" className="w-full rounded border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select name="category_id" value={form.category_id}onChange={handleChange}
                        className="w-full rounded border p-2 bg-white">
                            <option value="">No Category</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.category_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Description</label>
                        <input name="description" value={form.description} onChange={handleChange} placeholder="Product Description" className="w-full rounded border p-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                        <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="https://example.com/image.jpg" className="w-full rounded border p-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        <input name="price" value={form.price} onChange={handleChange} placeholder="0.00" className="w-full rounded border p-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sizes</label>
                        <input name="sizes" value={form.sizes} onChange={handleChange} placeholder="xs, s, m, l, xl, na," className="w-full rounded border p-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Colors</label>
                        <input name="colors" value={form.colors} onChange={handleChange} placeholder="black, white, blue" className="w-full rounded border p-2" />
                    </div>

                    <div className="flex items-center gap-2">
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active product</label>
                        <input id="is_active" type="checkbox" checked={form.is_active} onChange={(e) =>
                            setForm((prev) => ({ ...prev, is_active: e.target.checked }))
                        } className="h-4 w-4 rounded border-gray-300"/>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={generateVariants}
                            className="rounded bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
                        >
                            Generate Variants
                        </button>
                    </div>

                    {variants.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                            <h3 className="mb-2 font-semibold text-gray-800">Generated Variants ({variants.length})</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {variants.map((v, i) => (
                                    <div key={v.id ?? i} className="flex flex-wrap items-center gap-2 rounded border bg-gray-50 p-3">

                                        <div className="w-32 text-sm font-medium text-gray-700">
                                            {v.size} / {v.color}
                                        </div>

                                        <div className="flex-1">
                                            <input type="text" value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                                            placeholder="SKU"
                                            className="w-full rounded border bg-white p-1.5 text-sm"/>
                                        </div>

                                        <div className="w-24">
                                            <input type="number"
                                            value={v.stock}
                                            onChange={(e) => updateVariant(i, 'stock', e.target.value)} 
                                            placeholder="Stock"
                                            className="w-full rounded border bg-white p-1.5 text-sm"/>
                                        </div>

                                        {product && v.id && (
                                            <button
                                                type="button"
                                                onClick={() => handleSaveVariant(v)}
                                                className="rounded bg-emerald-600 px-2.5 py-1.5 text-xs text-white hover:bg-emerald-700">
                                                    Save
                                            </button>
                                        )}
                                        {product && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteVariant(v, i)}
                                                className="rounded bg-red-600 px-2.5 py-1.5 text-xs text-white hover:bg-red-700">
                                                    Delete
                                            </button>
                                        )}
                                    </div>
                                ))}

                            </div>
                        </div>
                    )}

                    {product && (
                        <div className="mt-4 border-t pt-4">
                            <h3 className="mb-2 text-sm font-semibold text-gray-800">Add Variant</h3>
                            <div className="flex flex-wrap items-center gap-2 rounded border border-dashed bg-gray-50 p-3">
                                <input
                                    type="text"
                                    value={newVariant.sku}
                                    onChange={(e) => setNewVariant((prev) => ({ ...prev, sku: e.target.value }))}
                                    placeholder="SKU"
                                    className="min-w-32 flex-1 rounded border bg-white p-1.5 text-sm"
                                />
                                <input
                                    type="text"
                                    value={newVariant.size}
                                    onChange={(e) => setNewVariant((prev) => ({ ...prev, size: e.target.value }))}
                                    placeholder="Size"
                                    className="w-24 rounded border bg-white p-1.5 text-sm"
                                />
                                <input
                                    type="text"
                                    value={newVariant.color}
                                    onChange={(e) => setNewVariant((prev) => ({ ...prev, color: e.target.value }))}
                                    placeholder="Color"
                                    className="w-28 rounded border bg-white p-1.5 text-sm"
                                />
                                <input
                                    type="number"
                                    value={newVariant.stock}
                                    onChange={(e) => setNewVariant((prev) => ({ ...prev, stock: e.target.value }))}
                                    placeholder="Stock"
                                    className="w-24 rounded border bg-white p-1.5 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddVariant}
                                    className="rounded bg-gray-800 px-3 py-1.5 text-xs text-white hover:bg-gray-700"
                                >
                                    Add variant
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                        <button type="button" onClick={onClose} className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Cancel
                        </button>
                        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}