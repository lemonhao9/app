import Traoul from '@/assets/Traoul.jpg';
import uberdépanne from '@/assets/uberdépanne.jpg';

export function About() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100">
      <main className="w-full max-w-5xl px-6 pt-24 pb-10">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-4">
            <h1 className="text-xl font-bold">LeCycleLyonnais</h1>
            <h2 className="font-semibold text-gray-700">
              Fort de ses 68 ans d'expériences dans la vente et l’entretien de vélos, LeCycleLyonnais met en place un service de réparation et d’entretien à domicile de vélos et vélos électriques (VAE). La vente additionnelle de produits dédiés sera aussi proposée. Elle vise à offrir un service complet et pratique pour les cyclistes de Lyon et ses alentours.
            </h2>
          </div>

          <img
            src={Traoul}
            alt="Technicien LeCycleLyonnais en intervention"
            className="hidden md:block w-full h-[250px] max-h-[500px] object-cover rounded-xl"
          />
          <img
              src={uberdépanne}
              alt="Technicien LeCycleLyonnais en intervention"
              className="hidden md:block w-full h-[250px] max-h-[500px] object-cover rounded-xl"
            />
          <p className="text-gray-600">
              Notre mission est de rendre l’entretien et la réparation de vélos accessible à tous, directement à domicile, sur votre lieu de travail... tout en offrant des produits de qualité pour améliorer l’expérience cycliste. Nous disposons de techniciens qualifiés et salariés expérimentés pour garantir un service fiable et professionnel.
            </p>
            
        </div>
      </main>
    </div>
  );
}
