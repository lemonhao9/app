export async function geocode(q) {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erreur: BAN API request failed');
    const data = await response.json();
    return data.features.map(f => ({
        label: f.properties.label,
        city: f.properties.city,
        postcode: f.properties.postcode,
        longitude: f.geometry.coordinates[0],
        latitude: f.geometry.coordinates[1],
    }));
}