import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, "Query is required").max(120),
});

export const channelIdSchema = z.object({
  channelId: z
    .string()
    .trim()
    .regex(/^UC[A-Za-z0-9_-]{20,40}$/, "Invalid channel id"),
});

export const videosQuerySchema = z.object({
  playlistId: z
    .string()
    .trim()
    .regex(/^UU[A-Za-z0-9_-]{20,40}$/, "Invalid uploads playlist id"),
  limit: z
    .string()
    .trim()
    .regex(/^\d+$/)
    .transform((v) => Math.min(Math.max(parseInt(v, 10), 1), 50))
    .optional(),
});

export const earningsInputSchema = z.object({
  monthlyViews: z.number().nonnegative().max(1e12),
  country: z.string().min(1),
  niche: z.string().min(1),
  contentType: z.enum(["long", "shorts", "mixed"]),
  rpm: z.number().nonnegative().max(200).optional(),
  currency: z.string().min(1),
  monetizedPercentage: z.number().min(0).max(100),
  sponsorship: z.number().nonnegative().default(0),
  affiliate: z.number().nonnegative().default(0),
  membership: z.number().nonnegative().default(0),
});

export type EarningsInput = z.infer<typeof earningsInputSchema>;
