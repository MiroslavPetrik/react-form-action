"use server";

import { formAction } from "react-form-action";
import { z } from "zod";

const users = new Set<string>();

export const subscribeAction = formAction
  .input(z.object({ email: z.string().email() }))
  .error(async ({ error }) => {
    if (error instanceof Error) {
      return error.message;
    } else {
      return "Unexpected error";
    }
  })
  .run(async ({ input }) => {
    if (users.has(input.email)) {
      throw new Error("Already subscribed!");
    } else {
      users.add(input.email);
    }

    return null;
  });
