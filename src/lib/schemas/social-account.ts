import { z } from "zod";
import { SocialChannel } from "@prisma/client";

import { sanitizeSocialUrl } from "../url";

export const socialAccountSchema = z.object({
  channel: z.nativeEnum(SocialChannel),
  accountName: z.string().min(2, "El nombre de la cuenta debe tener al menos 2 caracteres"),
  accountId: z.string().min(1, "El ID de la cuenta es requerido"),
  accountUrl: z.preprocess(
    (val: unknown) => (typeof val === "string" && val.trim() !== "" ? sanitizeSocialUrl(val) : undefined),
    z.string().url("Debe ser una URL válida").optional().or(z.literal(""))
  ),
  avatar: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  isActive: z.boolean(),
});

export type SocialAccountFormValues = z.infer<typeof socialAccountSchema>;
