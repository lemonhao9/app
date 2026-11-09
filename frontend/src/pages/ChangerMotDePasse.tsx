import { useState, type SyntheticEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { NavBar } from '../components/ui/NavBar';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../services/users';
import { homePathForRole } from '../lib/utils';

export function ChangerMotDePasse() {
  const navigate = useNavigate();
  const { user, loading: authLoading, login, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const forced = user.must_change_password === true;

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { token, user: updated } = await changePassword({ currentPassword, newPassword });
      login(token, updated);
      navigate(homePathForRole(updated.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <NavBar dark />
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-xl border p-6 flex flex-col gap-4 mt-10">
        <h1 className="text-xl font-bold text-center">Changer mon mot de passe</h1>
        {forced && (
          <p className="text-sm text-gray-600">
            Votre mot de passe actuel est provisoire : choisissez-en un nouveau pour accéder à votre espace.
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="currentPassword" className="text-sm font-medium">
            {forced ? 'Mot de passe provisoire' : 'Mot de passe actuel'}
          </label>
          <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="newPassword" className="text-sm font-medium">Nouveau mot de passe</label>
          <div className="relative">
            <input id="newPassword" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500">8 caractères minimum</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="confirmPassword" className="text-sm font-medium">Confirmer le nouveau mot de passe</label>
          <input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" aria-invalid={mismatch} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {mismatch && <p className="text-sm text-red-600">Les mots de passe ne correspondent pas</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</Button>
        <button type="button" onClick={handleLogout} className="text-sm text-gray-600 underline">
          Se déconnecter
        </button>
      </form>
    </div>
  );
}