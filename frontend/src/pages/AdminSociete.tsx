import { useEffect, useState, type SyntheticEvent } from 'react';
import { Button } from '../components/ui/button';
import { getCompany, updateCompany, type Company } from '../services/company';
import { useCompany } from '../context/useCompany';

type FormState = Record<keyof Company, string>;

interface FieldConfig {
    key: keyof Company;
    label: string;
    maxLength: number;
    type?: 'text' | 'email';
    inputMode?: 'numeric';
    pattern?: string;
    hint?: string;
}

const SECTIONS: { title: string; fields: FieldConfig[] }[] = [
    {
        title: 'Identité',
        fields: [
            { key: 'name', label: 'Nom de la société', maxLength: 100 },
            { key: 'legal_form', label: 'Forme juridique', maxLength: 50, hint: 'SARL, SAS, EURL…' },
            { key: 'share_capital', label: 'Capital social (€)', maxLength: 10, inputMode: 'numeric', pattern: '\\d+', hint: 'Montant entier, sans espace' },
            { key: 'rcs_city', label: 'Ville du RCS', maxLength: 100 },
            { key: 'siret', label: 'SIRET', maxLength: 17, inputMode: 'numeric', pattern: '[\\d ]{14,17}', hint: '14 chiffres, espaces acceptés' },
        ],
    },
    {
        title: 'Siège social',
        fields: [
            { key: 'address_line', label: 'Adresse', maxLength: 255 },
            { key: 'postal_code', label: 'Code postal', maxLength: 5, inputMode: 'numeric', pattern: '\\d{5}' },
            { key: 'city', label: 'Ville', maxLength: 100 },
        ],
    },
    {
        title: 'Contact et publication',
        fields: [
            { key: 'email', label: 'E-mail de contact', maxLength: 255, type: 'email' },
            { key: 'publication_director', label: 'Directeur de la publication', maxLength: 255 },
        ],
    },
    {
        title: 'Hébergeur',
        fields: [
            { key: 'host_name', label: "Nom de l'hébergeur", maxLength: 255 },
            { key: 'host_address', label: "Adresse de l'hébergeur", maxLength: 255 },
        ],
    },
];

function toForm(company: Company): FormState {
    return { ...company, share_capital: String(company.share_capital) };
}

export function AdminSociete() {
    const { setCompany } = useCompany();
    const [form, setForm] = useState<FormState | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        getCompany({ cache: 'no-store' })
            .then(({ company }) => setForm(toForm(company)))
            .catch(err => setLoadError((err as Error).message));
    }, []);

    function updateField(key: keyof Company, value: string) {
        setForm(f => (f ? { ...f, [key]: value } : f));
        setSaved(false);
    }

    async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!form) return;
        setSaving(true);
        setSaveError(null);
        setSaved(false);
        try {
            const { company } = await updateCompany({ ...form, share_capital: Number(form.share_capital) });
            setCompany(company);
            setForm(toForm(company));
            setSaved(true);
        } catch (err) {
            setSaveError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Société</h1>
            <p className="text-sm text-gray-600 max-w-2xl">
                Ces informations s'affichent dans le pied de page et les pages légales (mentions légales, CGV, confidentialité).
                Les visiteurs peuvent voir les anciennes valeurs jusqu'à 5 minutes après l'enregistrement.
            </p>

            {loadError && <p className="text-sm text-red-600">{loadError}</p>}
            {!form && !loadError && <p className="text-sm text-gray-600">Chargement...</p>}

            {form && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-2xl">
                    {SECTIONS.map(section => (
                        <fieldset key={section.title} className="bg-white border rounded-md p-4 flex flex-col gap-3">
                            <legend className="font-medium px-1">{section.title}</legend>
                            {section.fields.map(field => (
                                <div key={field.key} className="flex flex-col gap-1">
                                    <label htmlFor={`company-${field.key}`} className="text-sm font-medium">{field.label}</label>
                                    <input
                                        id={`company-${field.key}`}
                                        type={field.type ?? 'text'}
                                        inputMode={field.inputMode}
                                        pattern={field.pattern}
                                        value={form[field.key]}
                                        onChange={e => updateField(field.key, e.target.value)}
                                        required
                                        maxLength={field.maxLength}
                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    />
                                    {field.hint && <p className="text-xs text-gray-500">{field.hint}</p>}
                                </div>
                            ))}
                        </fieldset>
                    ))}
                    {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                    {saved && <p className="text-sm text-green-700">Informations enregistrées.</p>}
                    <Button type="submit" disabled={saving} className="self-start">
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </form>
            )}
        </div>
    );
}
