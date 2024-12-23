import { expectTypeOf, describe, test } from "vitest";
import { useActionContext } from "./Action";

describe("useActionContext", () => {
  test("context value has mutually exclusive progress flags", () => {
    const ctx = useActionContext<
      string,
      { type: string; message: string },
      {
        email?: { _errors: string[] };
        password?: { _errors: string[] };
      }
    >();

    expectTypeOf<typeof ctx>().toMatchTypeOf<
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
            email?: { _errors: string[] };
            password?: { _errors: string[] };
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
