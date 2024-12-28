"use server";

import { formAction } from "react-form-action";
import { z } from "zod";

const users = new Set<string>();

const baseAction = formAction
  .input(z.object({ email: z.string().email() }))
  .error(({ error }) => {
    if (error instanceof Error) {
      return error.message;
    } else {
      return "Unexpected error";
    }
  });

export const subscribeAction = baseAction.run(async ({ input }) => {
  if (users.has(input.email)) {
    throw new Error("Already subscribed!");
  } else {
    users.add(input.email);
  }

  return null;
});
