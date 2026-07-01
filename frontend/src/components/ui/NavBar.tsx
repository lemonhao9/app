import { Link } from "react-router-dom";
import {Button} from './button';
import logoSrc from '@/assets/LELOGOHCHwhite.svg'
import logoSrcDark from '@/assets/LELOGOHCHblack.svg'

export function NavBar({ dark = false }: { dark?: boolean }) {
    return (
        <nav className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-10 py-5">
            <Link to="/" className={`flex items-center gap-2 ${dark ? 'text-gray-900' : 'text-white'} font-bold text-lg tracking-tight`}>
            <img src={dark ? logoSrcDark : logoSrc} alt="HomeCycl'Home Logo" className="h-8 w-auto"/> <span>Home Cycl' Home</span>
            </Link>
            <div className="hidden md:flex items-center gap-10">
                <Link to="/" className={`${dark ? 'text-gray-900' : 'text-white'} font-medium hover:text-white/80 transition-colors`}>Accueil</Link>
                <Link to="/about" className={`${dark ? 'text-gray-900' : 'text-white'} font-medium hover:text-white/80 transition-colors`}>Nous découvrir</Link>
                <Link to="/forfaits" className={`${dark ? 'text-gray-900' : 'text-white'} font-medium hover:text-white/80 transition-colors`}>Nos offres</Link>
            </div>
            <Button asChild variant="outline" className={`${dark ? 'border-gray-900' : 'border-white'} ${dark ? 'text-gray-900' : 'text-white'} bg-transparent hover:text-gray-900`}>
                <Link to="/reserver">Prendre rendez-vous</Link>
            </Button>
        </nav>
    );
}