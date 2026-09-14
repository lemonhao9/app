import { getClient } from '../utils/db.js';
import * as interventionRepository from '../repositories/interventionRepository.js';
import * as slotRepository from '../repositories/slotRepository.js';
import * as bikeRepository from '../repositories/bikeRepository.js';
import * as addressRepository from '../repositories/addressRepository.js';
import * as feesRepository from '../repositories/feesRepository.js';
import * as productsRepository from '../repositories/productsRepository.js';

export async function createIntervention(clientId, { bike_id, slot_id, address_id, product_ids }) {
    const slot = await slotRepository.findBookableInfo(slot_id);
    if (!slot) {
        const err = new Error('Créneau introuvable');
        err.status = 404;
        throw err;
    }
    if (!slot.bookable) {
        const err = new Error("Ce créneau n'est plus disponible (déjà réservé, ou à moins de 2h)");
        err.status = 409;
        throw err;
    }

    const bike = await bikeRepository.findById(bike_id);
    if (!bike || bike.user_id !== clientId) {
        const err = new Error('Vélo introuvable');
        err.status = 404;
        throw err;
    }

    const address = await addressRepository.findById(address_id);
    if (!address || address.user_id !== clientId) {
        const err = new Error('Adresse introuvable');
        err.status = 404;
        throw err;
    }
    if (address.zone_id !== slot.zone_id) {
        const err = new Error("L'adresse sélectionnée ne correspond pas à la zone de ce créneau");
        err.status = 409;
        throw err;
    }

    const fee = await feesRepository.findById(slot.fee_id);
    const products = product_ids.length ? await productsRepository.findByIds(product_ids) : [];
    if (products.length !== product_ids.length) {
        const err = new Error('Un ou plusieurs produits sélectionnés sont introuvables ou indisponibles');
        err.status = 400;
        throw err;
    }

    const totalPrice = products.reduce((sum, p) => sum + parseFloat(p.price), parseFloat(fee.price_fee));

    const client = await getClient();
    let intervention;
    try {
        await client.query('BEGIN');
        intervention = await interventionRepository.create({
            bikeId: bike_id,
            slotId: slot_id,
            technicianId: slot.technician_id,
            clientId,
            addressId: address_id,
            totalPrice,
        }, client);
        for (const productId of product_ids) {
            await interventionRepository.addProduct(intervention.intervention_id, productId, client);
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') {
            const conflict = new Error("Ce créneau vient d'être réservé par quelqu'un d'autre, merci d'en choisir un autre.");
            conflict.status = 409;
            throw conflict;
        }
        throw err;
    } finally {
        client.release();
    }

    return intervention;
}

export async function addPhotos(clientId, interventionId, files) {
    const intervention = await interventionRepository.findById(interventionId);
    if (!intervention || intervention.client_id !== clientId) {
        const err = new Error('Intervention introuvable');
        err.status = 404;
        throw err;
    }
    const photos = [];
    for (const file of files) {
        photos.push(await interventionRepository.addPhoto(interventionId, `/uploads/${file.filename}`));
    }
    return photos;
}

export async function cancelIntervention(clientId, interventionId) {
    const intervention = await interventionRepository.findById(interventionId);
    if (!intervention || intervention.client_id !== clientId) {
        const err = new Error('Intervention introuvable');
        err.status = 404;
        throw err;
    }
    if (intervention.state !== 'prochainement') {
        const err = new Error('Cette intervention ne peut plus être annulée');
        err.status = 409;
        throw err;
    }
    return interventionRepository.cancel(interventionId);
}

export async function getMyInterventions(clientId, { sort, limit, offset }) {
    const rows = await interventionRepository.findByClientId(clientId, { sort, limit, offset });
    const hasMore = rows.length > limit;
    return { interventions: rows.slice(0, limit), hasMore };
}

export async function canAccessIntervention(userId, role, interventionId) {
    if (role === 'admin') return true;
    const id = Number(interventionId);
    if (!Number.isInteger(id)) return false;
    const intervention = await interventionRepository.findById(id);
    if (!intervention) return false;
    if (role === 'client') return intervention.client_id === userId;
    if (role === 'technician') return intervention.technician_id === userId;
    return false;
}
