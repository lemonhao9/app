import { NavBar } from "../components/ui/NavBar";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function Profil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <NavBar />
      <h1>Profil</h1>
      {user && (
        <div>
          <p>Nom: {user.name}</p>
          <p>Email: {user.email}</p>
          <p>Téléphone: {user.phone}</p>
          <p>Adresse: {user.address?.label}</p>
        </div>
      )}
        <Button onClick={() => {navigate('/Reserver')}}>Prendre un rendez-vous</Button>
        <Button onClick={logout}>Se déconnecter</Button>
    </div>
  );
}