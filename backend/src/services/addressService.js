export async function geocode(q) {
    const enriched = q.toLowerCase().includes('lyon') ? q : `${q} Lyon`;
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(enriched)}&limit=15&lon=4.8357&lat=45.7640`;
    const response = await fetch(url);
    if (!response.ok) {
        const err = new Error('Erreur: BAN API request failed');
        err.status = 502;
        throw err;
    }
    const data = await response.json();
    return data.features.filter(f => f.properties.postcode?.startsWith('69')).map(f => ({
        label: f.properties.label,
        city: f.properties.city,
        postcode: f.properties.postcode,
        longitude: f.geometry.coordinates[0],
        latitude: f.geometry.coordinates[1],
    }));
}