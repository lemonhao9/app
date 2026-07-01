import { Link } from "react-router-dom";
import { Button } from '@/components/ui/button';
import { NavBar } from '@/components/ui/NavBar';
import CrayonHorizontal2 from '@/assets/CrayonHorizontal2.png';

const pitchCards = [
    {
        title: 'Création de compte',
        description: "Rejoignez-nous dès maintenant, en créant votre compte vous pourrez profiter des services de HomeCycl'Home. En renseignant votre vélo, votre adresse vous aurez la possibilité de prendre rendez-vous pour qu'on s'occupe de votre demande.",
        cta: 'Nous rejoindre',
        to: '/signup',
    },
    {
        title: 'Experts',
        description: "Passionnés par l'entraide et les deux roues depuis toujours. Chaque intervention est réalisée avec soin par des professionnels expérimentés, attentifs à vos besoins et à l'état de votre vélo. Disponibles, réactifs et à l'écoute, nous avons à cœur de vous offrir une assistance fiable et humaine, pour que chaque trajet reste un plaisir.",
        cta: 'Nous découvrir',
        to: '/about',
    },
    {
        title: 'Forfait adapté',
        description: "Plusieurs forfaits sont proposés afin de s'adapter précisément à votre situation. Du simple entretien courant au remplacement de pièces, jusqu'à la révision complète de votre vélo, choisissez l'offre qui vous convient. À partir de 15€, un technicien viendra à vous pour vous apporter son aide.",
        cta: 'Voir nos offres',
        to: '/forfaits',
    },
    {
        title: 'Assistance dans Lyon',
        description: "Plus besoin de vous déplacer ni de chercher un atelier ouvert : la réparation vient à vous, pour vous permettre de reprendre la route sans stress. Rapide, local et pratique : un professionnel proche de vous prend en charge votre vélo, que vous soyez chez vous, au travail ou en déplacement dans Lyon.",
        cta: 'Prendre rendez-vous',
        to: '/reserver',
    }
] as const;
export function LandingPage() {
  return (
    <div className="h-screen overflow-hidden relative">
      <div
        className="absolute inset-0 bg-cover bg-top"
        style={{ backgroundImage: `url(${CrayonHorizontal2})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>
      <NavBar />
      <div className="absolute top-24 left-10 z-10 max-w-lg">
        <h1 className="text-5xl font-bold text-white leading-tight">
          La réparation de votre vélo qui vient à vous
        </h1>
        <p className="text-white/90 mt-3 text-lg font-semibold">Par les Cycles Lyonnais</p>
      </div>
      <div className="absolute bottom-6 left-0 right-0 px-8 z-20">
        <div className="grid grid-cols-4 gap-4 max-w-7xl mx-auto">
          {pitchCards.map((card) => (
            <div key={card.title} className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-3 border border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base">{card.title}</h2>
              </div>
              <p className="text-sm text-gray-600 flex-1 leading-relaxed">{card.description}</p>
              <Button asChild variant="outline" className="w-full mt-auto">
                <Link to={card.to}>{card.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}