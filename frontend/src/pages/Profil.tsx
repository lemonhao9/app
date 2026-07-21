import { useEffect, useState } from "react";
import { NavBar } from "../components/ui/NavBar";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

    interface Address {
    address_id: number;
    address_name: string;
    city: string;
    postal_code: string;
    is_default: boolean;
}

export function Profil() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

const [addresses, setAddresses] = useState<Address[]>([]);

useEffect(() => {
    const token = localStorage.getItem('hch_token');
    if(!token)return;
    fetch('/api/v1/addresses/me', {headers: {Authorization: `Bearer ${token}`}})
        .then(res => res.json())
        .then(data => setAddresses(data.addresses))
        .catch(() => {});
}, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <NavBar dark/>
            {user && (
                <div className="p-6 rounded shadow-md w-80">
                    <h1 className="text-center">Profil</h1>
                    <p>Nom: {user.name}</p>
                    <p>Email: {user.email}</p>
                    <p>Téléphone: {user.phone}</p>
                    <p>Adresse : {addresses.find(a => a.is_default)?.address_name ?? '___'}</p>
                    <div className="flex flex-col gap-4 mt-4">
                        <Button onClick={() => { navigate('/my-garage') }}>Mon garage</Button>
                        <Button onClick={() => { navigate('/reserver') }}>Prendre un rendez-vous</Button>
                        <Button onClick={logout} className="bg-red-900">Se déconnecter</Button>
                    </div>
                </div>
            )}

        </div>
    );
}