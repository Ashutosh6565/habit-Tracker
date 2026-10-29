import { z } from "zod";

export const youtubeMetadataQuerySchema = z.object({
  url: z.string().trim().url(),
});
