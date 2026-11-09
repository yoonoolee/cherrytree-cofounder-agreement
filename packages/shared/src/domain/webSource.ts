import { z } from 'zod';

/**
 * A web page an agent used (web search or web fetch), shown as a link under its answer or reply.
 * Never cited in the draft.
 */
export const webSourceSchema = z.object({
  title: z.string(),
  url: z.string(),
});
export type WebSource = z.infer<typeof webSourceSchema>;
