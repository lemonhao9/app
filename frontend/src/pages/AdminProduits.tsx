import { useCallback, useEffect, useState } from 'react';
import { getAllProducts, createProduct, updateProduct, desactivateProduct, deleteProductPermanently, type Product } from '../services/products';
import { Button } from '../components/ui/button';

export function AdminProduits() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const refresh = useCallback(() => {
        getAllProducts()
            .then(data => setProducts(data.products))
            .catch(() => setError('Impossible de charger les produits additionnels.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    function resetForm() {
        setEditingId(null);
        setName(''); setCategory(''); setPrice(''); setDescription('');
    }

    function startEdit(product: Product) {
        setEditingId(product.product_id);
        setName(product.name);
        setCategory(product.category ?? '');
        setPrice(String(product.price));
        setDescription(product.description ?? '');
        setFormError(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);
        setSubmitting(true);
        const data = {
            name,
            category: category || undefined,
            description: description || undefined,
            price: Number(price),
        };
        try {
            if (editingId) {
                await updateProduct(editingId, data);
            } else {
                await createProduct(data);
            }
            resetForm();
            refresh();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Impossible d'enregistrer ce produit.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDesactivate(id: number) {
        if (editingId === id) resetForm();
        await desactivateProduct(id);
        refresh();
    }

    async function handleDeletePermanently(id: number) {
        setDeleteError(null);
        try {
            await deleteProductPermanently(id);
            refresh();
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Impossible de supprimer ce produit.');
        }
    }

    const active = products.filter(p => p.is_active);
    const inactive = products.filter(p => !p.is_active);

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-black uppercase tracking-wide">Produits additionnels</h1>

            <form onSubmit={handleSubmit} className="border rounded-xl p-4 bg-white flex flex-col gap-2">
                <h2 className="font-bold text-sm uppercase">{editingId ? 'Modifier le produit' : 'Nouveau produit'}</h2>
                <div className="flex flex-wrap gap-2">
                    <input placeholder="Nom" value={name} onChange={e => setName(e.target.value)} required className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                    <input placeholder="Catégorie (optionnel)" value={category} onChange={e => setCategory(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                    <input type="number" step="0.01" placeholder="Prix (€)" value={price} onChange={e => setPrice(e.target.value)} required className="border border-gray-300 rounded-md px-3 py-2 text-sm w-32" />
                </div>
                <textarea placeholder="Description (optionnel)" value={description} onChange={e => setDescription(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <div className="flex gap-2">
                    <Button type="submit" disabled={submitting} className="w-fit">
                        {submitting ? 'Enregistrement...' : editingId ? 'Enregistrer les modifications' : 'Créer le produit'}
                    </Button>
                    {editingId && (
                        <Button type="button" variant="outline" className="w-fit" onClick={resetForm}>
                            Annuler
                        </Button>
                    )}
                </div>
            </form>

            {loading && <p className="text-sm text-gray-500">Chargement...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map(product => (
                    <div key={product.product_id} className="border rounded-xl p-4 bg-white flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <p className="font-bold text-sm">{product.name}</p>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Actif</span>
                        </div>
                        {product.category && <p className="text-xs text-gray-500 uppercase">{product.category}</p>}
                        <p className="text-sm">{product.price} €</p>
                        {product.description && <p className="text-xs text-gray-600">{product.description}</p>}
                        <Button variant="outline" size="sm" className="w-fit" onClick={() => startEdit(product)}>Modifier</Button>
                        <Button variant="destructive" size="sm" className="w-fit" onClick={() => handleDesactivate(product.product_id)}>Désactiver</Button>
                    </div>
                ))}
            </div>

            {inactive.length > 0 && (
                <>
                    <h2 className="font-bold text-sm uppercase text-gray-500">Produits désactivés</h2>
                    {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {inactive.map(product => (
                            <div key={product.product_id} className="border rounded-xl p-4 bg-gray-50 flex flex-col gap-2 opacity-60">
                                <p className="font-bold text-sm">{product.name}</p>
                                <p className="text-sm">{product.price} €</p>
                                <Button variant="destructive" size="sm" className="w-fit" onClick={() => handleDeletePermanently(product.product_id)}>Supprimer définitivement</Button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
