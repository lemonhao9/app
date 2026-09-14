export function CGV() {
    return (
        <div className="min-h-screen bg-gray-100">
            <main className="w-full max-w-3xl mx-auto px-6 pt-24 pb-16 flex flex-col gap-8">
                <h1 className="text-2xl font-black uppercase tracking-wide">Conditions générales de vente</h1>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Objet</h2>
                    <p className="text-sm text-gray-600">
                        Les présentes conditions régissent les prestations d'entretien et de réparation de vélos et
                        vélos à assistance électrique (VAE) à domicile, ainsi que la vente de produits additionnels
                        proposées par LeCycleLyonnais via le site Home Cycl'Home.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Zone d'intervention</h2>
                    <p className="text-sm text-gray-600">
                        Les interventions sont assurées sur Lyon et sa métropole, dans les zones géographiques
                        couvertes par nos techniciens. La zone est déterminée automatiquement à partir de l'adresse
                        renseignée par le client.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Compte client et réservation</h2>
                    <p className="text-sm text-gray-600">
                        La réservation d'une intervention nécessite la création d'un compte client. Le client
                        sélectionne un vélo enregistré, un forfait, une adresse et un créneau disponible dans sa zone.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Tarifs et paiement</h2>
                    <p className="text-sm text-gray-600">
                        Les tarifs des forfaits et produits additionnels sont indiqués en euros TTC sur la page
                        « Nos offres ». Le règlement s'effectue directement auprès du technicien à l'issue de
                        l'intervention, par carte bancaire ou en espèces. Aucun paiement en ligne n'est requis lors
                        de la réservation.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Annulation</h2>
                    <p className="text-sm text-gray-600">
                        Le client peut annuler une intervention depuis son espace client jusqu'à 2 heures avant le
                        début du créneau réservé. Passé ce délai, nous contacter directement par email: <a href="mailto:contact@homecyclhome.fr" className="underline">contact@homecyclhome.fr</a>
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Responsabilité</h2>
                    <p className="text-sm text-gray-600">
                        Le technicien procède à un contrôle du vélo avant et après intervention. Toute réclamation
                        doit être signalée sous 48 heures, photos à l'appui, via l'espace client ou par email.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Droit applicable</h2>
                    <p className="text-sm text-gray-600">
                        Les présentes CGV sont soumises au droit français. Tout litige relève de la compétence des
                        tribunaux de Lyon.
                    </p>
                </section>
            </main>
        </div>
    );
}
