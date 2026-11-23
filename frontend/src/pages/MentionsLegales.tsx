import { useCompany } from '../context/useCompany';
import { formatCapital, formatSiret } from '../services/company';

export function MentionsLegales() {
    const { company } = useCompany();
    return (
        <div className="min-h-screen bg-gray-100">
            <main className="w-full max-w-3xl mx-auto px-6 pt-24 pb-16 flex flex-col gap-8">
                <h1 className="text-2xl font-black uppercase tracking-wide">Mentions légales</h1>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Éditeur du site</h2>
                    <p className="text-sm text-gray-600">
                        Le site Home Cycl'Home est édité par LemonHao pour le compte de {company.name}, {company.legal_form} au capital social de {formatCapital(company.share_capital)},
                        immatriculée au RCS de {company.rcs_city} sous le numéro SIRET {formatSiret(company.siret)}, dont le siège social est
                        situé {company.address_line}, {company.postal_code} {company.city}, France.
                    </p>
                    <p className="text-sm text-gray-600">
                        Directeur de la publication : {company.publication_director}.<br />
                        Contact : <a href={`mailto:${company.email}`} className="underline">{company.email}</a>
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Hébergement</h2>
                    <p className="text-sm text-gray-600">
                        Le site est hébergé par {company.host_name}, {company.host_address}.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="font-bold text-sm uppercase tracking-wide">Propriété intellectuelle</h2>
                    <p className="text-sm text-gray-600">
                        L'ensemble des contenus présents sur le site (textes, visuels, logo) est la propriété de
                        {company.name}, sauf mention contraire, et ne peut être reproduit sans autorisation préalable.
                    </p>
                </section>
            </main>
        </div>
    );
}
