import { Link } from 'react-router-dom';
import logoSrc from '@/assets/LELOGOHCHwhite.svg';
import facebookIcon from '@/assets/facebookIcon.svg';
import instagramIcon from '@/assets/instagramIcon.svg';

const navLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/about', label: 'Nous découvrir' },
    { to: '/forfaits', label: 'Nos offres' },
    { to: '/reserver', label: 'Prendre rendez-vous' },
];

const legalLinks = [
    { to: '/mentions-legales', label: 'Mentions légales' },
    { to: '/cgv', label: 'CGV' },
    { to: '/confidentialite', label: 'Confidentialité' },
];

export function Footer() {
    return (
        <footer className="bg-black text-white">
            <div className="max-w-[1400px] mx-auto px-6 sm:px-10 py-12 grid grid-cols-2 md:grid-cols-4 gap-10">
                <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
                    <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
                        <img src={logoSrc} alt="HomeCycl'Home Logo" className="h-8 w-auto" />
                        <span>Home Cycl' Home</span>
                    </Link>
                    <p className="text-sm text-white/60">
                        La réparation et l'entretien<br/> de vélos et VAE qui vient à vous.<br/> Par LeCycleLyonnais.
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                        <a href="#" aria-label="Facebook">
                            <img src={facebookIcon} alt="" className="w-5 h-5 invert opacity-70 hover:opacity-100 transition-opacity" />
                        </a>
                        <a href="#" aria-label="Instagram">
                            <img src={instagramIcon} alt="" className="w-5 h-5 invert opacity-70 hover:opacity-100 transition-opacity" />
                        </a>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <p className="font-semibold text-sm uppercase tracking-wide text-white/50 mb-1">Navigation</p>
                    {navLinks.map(link => (
                        <Link key={link.to} to={link.to} className="text-sm text-white/80 hover:text-white transition-colors">
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="flex flex-col gap-2">
                    <p className="font-semibold text-sm uppercase tracking-wide text-white/50 mb-1">Informations légales</p>
                    {legalLinks.map(link => (
                        <Link key={link.to} to={link.to} className="text-sm text-white/80 hover:text-white transition-colors">
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="flex flex-col gap-2">
                    <p className="font-semibold text-sm uppercase tracking-wide text-white/50 mb-1">Contact</p>
                    <a href="mailto:contact@homecyclhome.fr" className="text-sm text-white/80 hover:text-white transition-colors">
                        contact@homecyclhome.fr
                    </a>
                </div>
            </div>

            <div className="border-t border-white/10 px-6 sm:px-10 py-4 text-center text-xs text-white/50">
                © 2026 LeCycleLyonnais. Tous droits réservés Lemon Hao
            </div>
        </footer>
    );
}
