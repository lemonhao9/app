import { useAuth } from '@/context/AuthContext';

export function TechnicianProfil() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="border rounded-xl p-6 bg-white max-w-md flex flex-col gap-4">
            <h1 className="text-xl font-black uppercase tracking-wide">Mes informations</h1>
            <div className="flex items-center gap-4">
                {user.picture ? (
                    <img src={user.picture} alt="Photo de profil" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200" />
                )}
                <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-500">Technicien</p>
                </div>
            </div>
            <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                    <dt className="text-gray-500">Email</dt>
                    <dd className="font-medium">{user.email}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <dt className="text-gray-500">Téléphone</dt>
                    <dd className="font-medium">{user.phone ?? '—'}</dd>
                </div>
            </dl>
        </div>
    );
}
