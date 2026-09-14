export function MentionsLegales() {
    return (
        <div className="min-h-screen bg-gray-100">
            <main className="w-full max-w-3xl mx-auto px-6 pt-24 pb-16 flex flex-col gap-8">
                <h1 className="text-2xl font-black uppercase tracking-wide">Mentions légales</h1>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Éditeur du site</h2>
                    <p className="text-sm text-gray-600">
                        Le site Home Cycl'Home est édité par LemonHao pour le compte de LeCycleLyonnais, SARL au capital social de 25 000 €,
                        immatriculée au RCS de Lyon sous le numéro SIRET 812 345 678 00019, dont le siège social est
                        situé 12 rue de la Part-Dieu, 69003 Lyon, France.
                    </p>
                    <p className="text-sm text-gray-600">
                        Directeur de la publication : la gérance de LeCycleLyonnais.<br />
                        Contact : <a href="mailto:contact@homecyclhome.fr" className="underline">contact@homecyclhome.fr</a>
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Hébergement</h2>
                    <p className="text-sm text-gray-600">
                        Le site est hébergé par OVH SAS, 2 rue Kellermann, 59100 Roubaix, France.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Propriété intellectuelle</h2>
                    <p className="text-sm text-gray-600">
                        L'ensemble des contenus présents sur le site (textes, visuels, logo) est la propriété de
                        LeCycleLyonnais, sauf mention contraire, et ne peut être reproduit sans autorisation préalable.
                    </p>
                </section>
            </main>
        </div>
    );
}
