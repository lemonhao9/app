import { useEffect, useState } from 'react';
import {NavBar} from '@/components/ui/NavBar';

interface Fee {
    fee_id: number;
    name_fee: string;
    price_fee: string;
    duration: number;
    description_forfait: string | null;
    optional_title: string | null;
    optional_desc: string | null;
    optional_price: string | null;
}

interface Product{
    product_id: number;
    name:string;
    category:string;
    price:string;
}

function formatDuration(minutes: number): string {
    if (minutes === 45) return "30-45 minutes";
    if (minutes >= 60) return `${Math.floor(minutes / 60)}h`;
    return `${minutes} minutes`;
}

function FeeCard({ fee }: { fee: Fee }) {
    const [mainDesc, offertDesc] = (fee.description_forfait ?? '').split('OFFERT:');
    const mainLines = mainDesc.trim().split('\n').filter(Boolean);
    const offertLines = offertDesc?.trim().split('\n').filter(Boolean) ?? [];

    return (
        <div className="border rounded-xl p-5 flex flex-col gap-3 bg-white h-full">
            <div>
                <p className="font-bold text-sm">
                    {fee.name_fee} {parseFloat(fee.price_fee)}€
                </p>
                <p className="text-xs text-gray-600 space-y-0.5 flex-1">
                    Durée prévue : {formatDuration(fee.duration)}
                </p>
            </div>

            <ul className="text-xs text-gray-600 space-y-0.5 flex-1">
                {mainLines.map((line, i) => (
                    <li key={i}>{line}</li>
                ))}
            </ul>

            {fee.optional_title && (
                <div className="text-xs">
                    <p className="font-semibold">{fee.optional_title}</p>
                    {(fee.optional_desc ?? '').split('\n').filter(Boolean).map((line, i) => (
                        <p key={i} className="text-gray-600">{line}</p>
                    ))}
                </div>
            )}

            {offertLines.length > 0 && (
                <div className="text-xs">
                    <p className="font-semibold">Offert :</p>
                    {offertLines.map((line, i) => 
                        <p key={i} className="text-gray-600">{line}</p>
                    )}
                </div>
            )}
        </div>
    );
}

function ProductsColumn ({ products }: { products: Product[] }) {
    const produits = products.filter(p => p.category === 'produit');
    const services = products.filter(p => p.category === 'service');

    return (
        <div className='border rounded-xl p-5 bg-white h-full flex flex-col gap-3'>
            <div>
                <p className="font-bold text-sm">Produits additionnels</p>
                <p className="text-xs text-gray-400 mt-0.5">Ajoutez des produits pour compléter votre intervention</p>
            </div>
            <div className="space-y-1">
                {produits.map(p => (
                    <div key={p.product_id} className="flex justify-between text-xs">
                        <span className="text-gray-600">{p.name}</span>
                        <span className="font-semibold">{parseFloat(p.price).toFixed(2).replace('.', ',')}€</span>
                    </div>
                ))}
            </div>
                {services.length > 0 && (
                    <div className="mt-2">
                        <p className="font-bold text-sm mb-1">Services complémentaires</p>
                        {services.map(p => (
                            <p key={p.product_id} className="text-xs text-gray-600">{p.name}</p>
                        ))}
                    </div>
                )}
        </div>
    );
}

export function Forfaits() {
    const [fees, setFees] = useState<Fee[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        fetch('/api/v1/fees').then(r=> r.json()).then(setFees);
        fetch('/api/v1/products').then(r=> r.json()).then(setProducts);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b relative">
                <NavBar dark />
            </div>

            <main className="px-8 pt-24 pb-10 max-w-[1400px] mx-auto">
                <h1 className="text-2xl font-black uppercase tracking-wide mb-6">Nos forfaits</h1>

                <div className="grid grid-cols-5 gap-4 items-start">
                    {fees.map(fee => (
                        <FeeCard key={fee.fee_id} fee={fee} />
                    ))}
                    <ProductsColumn products={products} />
                </div>
            </main>
        </div>
    );
}