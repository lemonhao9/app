import { useState, useEffect, useRef } from 'react';

interface AddressSuggestion {
    label: string;
    city: string;
    postcode: string;
    longitude: number;
    latitude: number;
}

interface Props {
    onSelect: (address: AddressSuggestion) => void;
    placeholder?: string;
}

export function AddressAutocomplete({ onSelect, placeholder = "Entrez votre adresse" }: Props) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [open, setOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect (() => {
        if (query.trim().length < 2) {
            setSuggestions([]);
            setOpen(false);
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch (`/api/v1/addresses/geocode?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setSuggestions(data);
                setOpen(data.length > 0);
            } catch {
                setSuggestions([]);
            }
        }, 150);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    function handleSelect(suggestion: AddressSuggestion) {
        setQuery(suggestion.label);
        setSuggestions([]);
        setOpen(false);
        onSelect(suggestion);
    }

    return (
        <div className="relative w-full">
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            {open && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((s, i)=> (
                        <li key={i} onClick={() => handleSelect(s)} className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer">
                            {s.label}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}