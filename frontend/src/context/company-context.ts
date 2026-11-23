import { createContext } from 'react';
import type { Company } from '../services/company';

export const DEFAULT_COMPANY: Company = {
    name: 'LeCycleLyonnais',
    legal_form: 'SARL',
    share_capital: 25000,
    rcs_city: 'Lyon',
    siret: '81234567800019',
    address_line: '12 rue de la Part-Dieu',
    postal_code: '69003',
    city: 'Lyon',
    email: 'contact@homecyclhome.fr',
    publication_director: 'la gérance de LeCycleLyonnais',
    host_name: 'OVH SAS',
    host_address: '2 rue Kellermann, 59100 Roubaix, France',
};

export interface CompanyContextValue {
    company: Company;
    setCompany: (company: Company) => void;
}

export const CompanyContext = createContext<CompanyContextValue>({ company: DEFAULT_COMPANY, setCompany: () => { } });
