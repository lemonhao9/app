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