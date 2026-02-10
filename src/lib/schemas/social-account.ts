import { z } from "zod";
import { SocialChannel } from "@prisma/client";

export const socialAccountSchema = z.object({
  channel: z.nativeEnum(SocialChannel),
  accountName: z.string().min(2, "El nombre de la cuenta debe tener al menos 2 caracteres"),
  accountId: z.string().min(1, "El ID de la cuenta es requerido"),
  accountUrl: z.string().url("Debe ser una URL válida").optional().or(z.string().length(0)),
  avatar: z.string().url("Debe ser una URL válida").optional().or(z.string().length(0)),
  isActive: z.boolean(),
});

export type SocialAccountFormValues = z.infer<typeof socialAccountSchema>;
