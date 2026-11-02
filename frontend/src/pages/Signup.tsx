import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/button';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { useState, type SyntheticEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
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
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
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
      navigate('/profil', { replace: true });
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
          <div className="relative">
            <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500">8 caractères minimum</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="confirmPassword" className="text-sm font-medium">Confirmer le mot de passe</label>
          <input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" aria-invalid={mismatch} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {mismatch && <p className="text-xs text-red-600">Les mots de passe ne correspondent pas.</p>}
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