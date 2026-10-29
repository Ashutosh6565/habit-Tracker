import { z } from "zod";

export const gameParamSchema = z.object({
  gameId: z.string().min(1).max(64),
});
