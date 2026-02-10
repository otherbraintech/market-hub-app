import { z } from "zod";
import { ContentType, ContentFormat, SocialChannel, ContentStatus } from "@prisma/client";

export const contentSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  type: z.nativeEnum(ContentType),
  format: z.nativeEnum(ContentFormat),
  channel: z.nativeEnum(SocialChannel).optional(),
  campaignId: z.string(),
  productId: z.string(),
  socialAccountId: z.string(),
  body: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  scheduledAt: z.date().optional().nullable(),
  status: z.nativeEnum(ContentStatus),
  mediaUrl: z.string(),
});

export type ContentFormValues = z.infer<typeof contentSchema>;
