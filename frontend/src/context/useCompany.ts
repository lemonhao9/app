import { useContext } from 'react';
import { CompanyContext } from './company-context';

export function useCompany() {
    return useContext(CompanyContext);
}
