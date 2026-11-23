import { useEffect, useState, type ReactNode } from 'react';
import { getCompany, type Company } from '../services/company';
import { CompanyContext, DEFAULT_COMPANY } from './company-context';

export function CompanyProvider({ children }: { children: ReactNode }) {
    const [company, setCompany] = useState<Company>(DEFAULT_COMPANY);

    useEffect(() => {
        getCompany()
            .then(({ company }) => setCompany(company))
            .catch(() => { });
    }, []);

    return (
        <CompanyContext.Provider value={{ company, setCompany }}>
            {children}
        </CompanyContext.Provider>
    );
}
