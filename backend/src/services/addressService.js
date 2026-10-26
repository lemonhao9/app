import * as addressRepository from '../repositories/addressRepository.js';
import * as zoneService from './zoneService.js';

const MAX_ADDRESSES_PER_USER = 10;

export async function getMyAddresses(userId) {
    return await addressRepository.findByUserId(userId);
}

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

export async function geocodeExact(label) {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(label)}&limit=5`;
    let response = null;
    try {
        response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    } catch {
        response = null;
    }
    if (!response?.ok) {
        const err = new Error('Service de géocodage indisponible, veuillez réessayer dans quelques instants');
        err.status = 502;
        throw err;
    }
    const data = await response.json();
    const feature = data.features.find(f => f.properties.label === label && f.properties.postcode?.startsWith('69'));
    if (!feature) {
        const err = new Error('Adresse introuvable : choisissez-la dans la liste des suggestions');
        err.status = 422;
        throw err;
    }
    return {
        label: feature.properties.label,
        city: feature.properties.city,
        postcode: feature.properties.postcode,
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
    };
}

export async function createAddress(userId, label) {
    const existing = await addressRepository.findByUserId(userId);
    if (existing.length >= MAX_ADDRESSES_PER_USER) {
        const err = new Error(`Vous ne pouvez pas enregistrer plus de ${MAX_ADDRESSES_PER_USER} adresses`);
        err.status = 409;
        throw err;
    }
    if (existing.some(a => a.address_name === label)) {
        const err = new Error('Cette adresse est déjà enregistrée');
        err.status = 409;
        throw err;
    }
    const address = await geocodeExact(label);
    const zoneId = await zoneService.findZoneForPoint(address.latitude, address.longitude);
    return addressRepository.create({
        addressName: address.label,
        city: address.city,
        postalCode: address.postcode,
        longitude: address.longitude,
        latitude: address.latitude,
        isDefault: false,
        zoneId,
        userId,
    });
}
