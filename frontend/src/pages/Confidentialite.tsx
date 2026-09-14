export function Confidentialite() {
    return (
        <div className="min-h-screen bg-gray-100">
            <main className="w-full max-w-3xl mx-auto px-6 pt-24 pb-16 flex flex-col gap-8">
                <h1 className="text-2xl font-black uppercase tracking-wide">Politique de confidentialité</h1>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Responsable de traitement</h2>
                    <p className="text-sm text-gray-600">
                        LeCycleLyonnais est responsable du traitement des données personnelles collectées via le
                        site Home Cycl'Home.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Données collectées</h2>
                    <p className="text-sm text-gray-600">
                        Identité et coordonnées (nom, email, téléphone), adresses d'intervention, vélos enregistrés,
                        historique et photos des interventions.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Finalités et base légale</h2>
                    <p className="text-sm text-gray-600">
                        Ces données sont utilisées pour la gestion du compte client, l'attribution automatique d'un
                        technicien selon la zone géographique, et le suivi des interventions réservées dans le
                        cadre de l'exécution du contrat de prestation.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Destinataires</h2>
                    <p className="text-sm text-gray-600">
                        Seule l'équipe LeCycleLyonnais et le technicien assigné à une intervention ont accès aux
                        données nécessaires à son bon déroulement. Aucune donnée n'est cédée à des tiers commerciaux.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Durée de conservation</h2>
                    <p className="text-sm text-gray-600">
                        Les données sont conservées pendant la durée de vie du compte, puis pour la durée légale de
                        conservation comptable applicable aux interventions facturées.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Vos droits</h2>
                    <p className="text-sm text-gray-600">
                        Vous disposez d'un droit d'accès, de rectification et d'effacement de vos données. La
                        suppression de votre compte entraîne son anonymisation définitive. Pour exercer ces droits,
                        contactez-nous à <a href="mailto:contact@homecyclhome.fr" className="underline">contact@homecyclhome.fr</a>.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Cookies</h2>
                    <p className="text-sm text-gray-600">
                        Le site utilise uniquement un jeton de session technique nécessaire à l'authentification.
                        Aucun cookie de mesure d'audience ou publicitaire tiers n'est déposé.
                    </p>
                </section>
            </main>
        </div>
    );
}
