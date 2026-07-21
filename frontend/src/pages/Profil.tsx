import { NavBar } from "../components/ui/NavBar";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function Profil() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <NavBar dark/>
            {user && (
                <div className="p-6 rounded shadow-md w-80">
                    <h1 className="text-center">Profil</h1>
                    <p>Nom: {user.name}</p>
                    <p>Email: {user.email}</p>
                    <p>Téléphone: {user.phone}</p>
                    <div className="flex flex-col gap-4 mt-4">
                        <Button onClick={() => { navigate('/reserver') }}>Prendre un rendez-vous</Button>
                        <Button onClick={logout} className="bg-red-900">Se déconnecter</Button>
                    </div>
                </div>
            )}

        </div>
    );
}