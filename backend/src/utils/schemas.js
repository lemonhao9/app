import { z } from "zod";

export const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    name: z.string().min(1).max(255, "Le nom ne peut dépasser 255 caractères"),
});