import { z } from "zod";

/**
 * NOTE: must be a separate file, because in the action.ts file
 * Next.js will throw, that the refine is not async function (actions must be async funcitons).
 * Zod requires to call .parseAsync for async refinements.
 */
export const signupSchema = z
  .object({
    user: z.object({
      email: z.string().email(),
    }),
    password: z.string().min(8),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
  });
