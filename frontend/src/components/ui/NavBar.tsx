import { useState } from 'react';
import { Link } from "react-router-dom";
import { Button } from './button';
import { Menu, X } from 'lucide-react';
import logoSrc from '@/assets/LELOGOHCHwhite.svg'
import logoSrcDark from '@/assets/LELOGOHCHblack.svg'

export function NavBar({ dark = false }: { dark?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const textColor = dark ? 'text-gray-900' : 'text-white';

    return (
        <nav className="absolute top-0 left-0 right-0 z-20 px-6 sm:px-10 py-5">
            <div className="flex items-center justify-between">
                <Link to="/" className={`flex items-center gap-2 ${textColor} font-bold text-lg tracking-tight`}>
                    <img src={dark ? logoSrcDark : logoSrc} alt="HomeCycl'Home Logo" className="h-8 w-auto" /> <span>Home Cycl' Home</span>
                </Link>
            
            <div className="hidden md:flex items-center gap-10">
                    <Link to="/" className={`${textColor} font-medium hover:text-white/80 transition-opacity`}>Accueil</Link>
                    <Link to="/about" className={`${textColor} font-medium hover:text-white/80 transition-opacity`}>Nous découvrir</Link>
                    <Link to="/forfaits" className={`${textColor} font-medium hover:text-white/80 transition-opacity`}>Nos offres</Link>
                    <Button asChild variant="outline" className={`${dark ? 'text-gray-900' : 'text-black'} hover:bg-white/20`}>
                        <Link to="/reserver">Prendre rendez-vous</Link>
                    </Button>
                </div>

            <div className="hidden md:flex items-center gap-3">
                    <Button asChild variant="outline" className={`${dark ? 'border-gray-900' : 'border-white'} ${textColor} bg-transparent hover:bg-white hover:text-gray-900`}>
                        <Link to="/login">Se connecter</Link>
                    </Button>
                    <Button asChild variant="outline" className={`${dark ? 'border-gray-900' : 'border-white'} ${textColor} bg-transparent hover:bg-white hover:text-gray-900`}>
                        <Link to="/signup">S'inscrire</Link>
                    </Button>
                </div>

                <button
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                    aria-expanded={isOpen}
                    className={`md:hidden ${textColor}`}
                >
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {isOpen && (
                <div className="md:hidden mt-4 flex flex-col gap-4 bg-white rounded-xl p-6 shadow-lg">
                    <Link to="/" onClick={() => setIsOpen(false)} className="text-gray-900 font-medium">Accueil</Link>
                    <Link to="/about" onClick={() => setIsOpen(false)} className="text-gray-900 font-medium">Nous découvrir</Link>
                    <Link to="/forfaits" onClick={() => setIsOpen(false)} className="text-gray-900 font-medium">Nos offres</Link>
                    <Button asChild variant="outline" className="w-full">
                        <Link to="/reserver" onClick={() => setIsOpen(false)}>Prendre rendez-vous</Link>
                    </Button>
                    <div className="flex flex-col gap-3">
                        <Button asChild variant="outline" className="w-full">
                            <Link to="/login" onClick={() => setIsOpen(false)}>Se connecter</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link to="/signup" onClick={() => setIsOpen(false)}>S'inscrire</Link>
                        </Button>
                    </div>
                </div>
            )}
        </nav>
    );
}