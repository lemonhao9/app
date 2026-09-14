import { z } from "zod";

export const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    name: z.string().min(1).max(255, "Le nom ne peut dépasser 255 caractères"),
});

export const signupSchema = userSchema.extend({
    phone: z.string().trim().min(1).max(20).optional(),
    address: z.object({
        label: z.string().min(1),
        city: z.string().min(1),
        postcode: z.string().min(1),
        longitude: z.number(),
        latitude: z.number(),
    }),
});

export const bikeSchema = z.object({
    brand: z.string().trim().min(1).max(255).optional(),
    model: z.string().trim().min(1).max(255).optional(),
    year: z.coerce.number().int().min(1900).max(new Date().getFullYear()+1).optional(),
    bike_type: z.enum(['VTT', 'VTC', 'Route', 'Ville', 'Pliant', 'BMX', 'Enfant', 'Cargo-Triporteur']).optional(),
    is_electric: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});

export const userUpdateSchema = z.object({
    name: z.string().min(1).max(255, "Le nom ne peut dépasser 255 caractères").optional(),
    phone: z.string().trim().min(1).max(20).optional(),
    email: z.string().trim().email().optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").optional(),
}).refine(data => !data.newPassword || !!data.currentPassword, {
    message: "L'ancien mot de passe est requis pour changer de mot de passe",
    path: ['currentPassword'],
});


export const zoneSchema = z.object({
    name: z.string().min(1).max(255),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    geojson: z.object({
    type: z.literal('Feature'),
    geometry: z.object({
        type: z.literal('Polygon'),
        coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
    }),
}).passthrough(),

});

export const assignTechnicianSchema = z.object({
    userId: z.number().int().positive(),
});

export const createInterventionSchema = z.object({
    bike_id: z.coerce.number().int().positive(),
    slot_id: z.coerce.number().int().positive(),
    address_id: z.coerce.number().int().positive(),
    product_ids: z.array(z.coerce.number().int().positive()).default([]),
});
