"use server";

import { formAction } from "react-form-action";
import { z } from "zod";

const messages = {
  accept: "Request accepted. xyz now follows you.",
  reject: "Request rejected.",
  block: "xyz has been blocked.",
};

export const followRequestAction = formAction
  .input(z.object({ decision: z.enum(["accept", "reject", "block"]) }))
  .run(async ({ input }) => {
    // Simulate a slow request so the pending state is visible
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return messages[input.decision];
  });
