import { Outlet, Link, useLocation } from 'react-router-dom';
import { NavBar } from './ui/NavBar';

export function ClientLayout() {
    const location = useLocation();
    const links = [{ to: '/profil', label: 'Mon Profil'}, { to: '/my-garage', label: 'Mon Garage' }, { to: '/reserver', label: 'Prendre rendez-vous' },];

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar dark />
            <div className="pt-24 px-8 max-w-[1400px] mx-auto flex gap-8">
                <aside className="w-48 shrink-0">
                    <nav className="flex flex-col gap-2">
                        {links.map(link => (
                            <Link key={link.to} to={link.to} className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === link.to ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100 '}`}>
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </aside>
                <div className="flex-1 pb-10">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}