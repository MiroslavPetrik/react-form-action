import { expectTypeOf, describe, test } from "vitest";
import { z } from "zod";
import { formAction } from "./formAction";
import type { FormProps } from "./Form";

describe("FormProps", () => {
  test("children props have mutually exclusive progress flags", () => {
    const signUpSchema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const signUpAction = formAction
      .input(signUpSchema)
      .error(() => {
        const dbError = {
          type: "ProtocolError",
          message: "Email already exists",
        };
        return dbError;
      })
      .run(async () => {
        return "We've sent you and email";
      });

    function fakeFormRender<A, B, C>(props: FormProps<A, B, C>) {
      return props.children;
    }

    const children = fakeFormRender({
      action: signUpAction,
      initialData: "Please sign up",
      children: () => null,
    });

    expectTypeOf<typeof children>().parameter(0).toMatchTypeOf<
      | {
          isPending: boolean;
          type: "initial";
          isInitial: true;
          isInvalid: false;
          isSuccess: false;
          isFailure: false;
          data: string;
          error: null;
          validationError: null;
        }
      | {
          isPending: boolean;
          type: "invalid";
          isInitial: false;
          isInvalid: true;
          isSuccess: false;
          isFailure: false;
          data: null;
          error: null;
          validationError: {
            fieldErrors: {
              email?: string[];
              password?: string[];
            };
          };
        }
      | {
          isPending: boolean;
          type: "success";
          isInitial: false;
          isInvalid: false;
          isSuccess: true;
          isFailure: false;
          data: string;
          error: null;
          validationError: null;
        }
      | {
          isPending: boolean;
          type: "failure";
          isInitial: false;
          isInvalid: false;
          isSuccess: false;
          isFailure: true;
          data: null;
          error: { type: string; message: string };
          validationError: null;
        }
    >();
  });
});
