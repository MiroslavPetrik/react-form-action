"use server";

import { formAction } from "react-form-action";
import { z } from "zod";

export const followRequestAction = formAction
  .input(z.object({ decision: z.enum(["accept", "reject", "block"]) }))
  .run(async ({ input }) => {
    // Simulate a slow request so the pending state is visible
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return input.decision;
  });
