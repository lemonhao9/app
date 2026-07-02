import { Link } from "react-router-dom";
import { Button } from '@/components/ui/button';
import { NavBar } from '@/components/ui/NavBar';
import CrayonHorizontal2 from '@/assets/CrayonHorizontal2.png';

// const pitchCards = [
//     {
//         title: 'Création de compte',
//         description: "Rejoignez-nous dès maintenant, en créant votre compte vous pourrez profiter des services de HomeCycl'Home. En renseignant votre vélo, votre adresse vous aurez la possibilité de prendre rendez-vous pour qu'on s'occupe de votre demande.",
//         cta: 'Nous rejoindre',
//         to: '/signup',
//     },
//     {
//         title: 'Experts',
//         description: "Passionnés par l'entraide et les deux roues depuis toujours. Chaque intervention est réalisée avec soin par des professionnels expérimentés, attentifs à vos besoins et à l'état de votre vélo. Disponibles, réactifs et à l'écoute, nous avons à cœur de vous offrir une assistance fiable et humaine, pour que chaque trajet reste un plaisir.",
//         cta: 'Nous découvrir',
//         to: '/about',
//     },
//     {
//         title: 'Forfait adapté',
//         description: "Plusieurs forfaits sont proposés afin de s'adapter précisément à votre situation. Du simple entretien courant au remplacement de pièces, jusqu'à la révision complète de votre vélo, choisissez l'offre qui vous convient. À partir de 15€, un technicien viendra à vous pour vous apporter son aide.",
//         cta: 'Voir nos offres',
//         to: '/forfaits',
//     },
//     {
//         title: 'Assistance dans Lyon',
//         description: "Plus besoin de vous déplacer ni de chercher un atelier ouvert : la réparation vient à vous, pour vous permettre de reprendre la route sans stress. Rapide, local et pratique : un professionnel proche de vous prend en charge votre vélo, que vous soyez chez vous, au travail ou en déplacement dans Lyon.",
//         cta: 'Prendre rendez-vous',
//         to: '/reserver',
//     }
// ] as const;
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
      <div className="absolute top-24 left-10 z-10 ">
        <h1 className="text-5xl font-extrabold text-white leading-tight">
          La réparation de votre vélo qui vient à vous !
        </h1>
        <p className="text-white/90 mt-3 text-lg font-semibold">Par les Cycles Lyonnais</p>
      </div>
      

    </div>
  );
}