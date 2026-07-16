import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/button';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { useState, type SyntheticEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface SelectedAddress {
  label: string;
  city: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

export function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<SelectedAddress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!address) {
      setError('Veuillez sélectionner une adresse valide.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: phone.trim() || undefined,
          address,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Erreur lors de l\'inscription. Vérifiez vos informations.');
        return;
      }
      login(data.token, data.user);
      navigate('/');
    } catch {
      setError('Une erreur est survenue lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-10">
      <NavBar dark />
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-xl border p-6 flex flex-col gap-4 mt-10">
        <h1 className="text-xl font-bold text-center">Créer son compte</h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">Nom d'utilisateur</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">Adresse e-mail</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium">Numéro de téléphone</label>
          <input id="phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="address" className="text-sm font-medium">Adresse</label>
          <AddressAutocomplete onSelect={setAddress} placeholder="Entrez votre adresse" />
          {address && <p className="text-xs text-green-700">{address.label}</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading}> {loading ? 'Création de votre compte' : 'Créer mon compte'}</Button>

        <p className="text-sm text-center text-gray-600">Déjà un compte ? <Link to="/login" className="font-medium underline">Se connecter</Link></p>

      </form>
    </div>
  );
}