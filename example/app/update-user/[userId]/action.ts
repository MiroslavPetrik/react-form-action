"use server";

import { formAction } from "react-form-action";
import { z } from "zod";

export const updateUser = formAction
  .args([z.number()])
  .error(async ({ error }) => {
    // this could be in the default hander
    if (error instanceof Error) {
      return error;
    } else throw error;
  }) // pass the error to the failure() path
  .run(async ({ args: [userId] }) => {
    if (userId === 9) {
      return { userId };
    } else {
      throw new Error(`User with id=${userId} not found`);
    }
  });
