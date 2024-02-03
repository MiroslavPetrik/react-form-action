# react-form-action

Typesafe success & error state control for Next.js v14 form actions.

## Install

```
npm i react-form-action
```

## Usage

### Server Action (usable in Next.js)

```ts
"use server";

import { createFormAction } from "react-form-action";
import { z } from "zod";

// Define custom serializable error & success data types
type ErrorData = {
  message: string;
};

type SuccessData = {
  message: string;
};

type ValiationError = {
  name?: string;
};

const updateUserSchema = z.object({ name: z.string() });

export const updateUser = createFormAction<
  SuccessData,
  ErrorData,
  ValiationError
>(({ success, failure, invalid }) =>
  // success and failure helper functions create wrappers for success & error data respectively
  async (prevState, formData) => {
    if (prevState.type === "initial") {
      // use the initialData passed to <Form /> here
      // prevState.data === "foobar"
    }

    try {
      const { name } = updateUserSchema.parse({
        name: formData.get("name"),
      });

      const user = await updateCurrentUser(name);

      if (user) {
        // {type: "success", data: "Your profile has been updated.", error: null, validationError: null}
        return success({
          message: "Your profile has been updated.",
        });
      } else {
        // {type: "error", data: null, error: { message: "No current user." }, validationError: null}
        return failure({ message: "No current user." });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        // {type: "invalid", data: null, error: null, validationError: {name: "Invalid input"}}
        return invalid({
          name: error.issues[0]?.message ?? "Validation error",
        });
      }

      return failure({ message: "Failed to update user." });
    }
  }
);
```

### `<Form>` Component

```tsx
"use client";
// Form connects the formAction to the formState & provides the meta state props via render prop
import { Form } from "react-form-action/client";

import { updateUser } from "@/actions";

export function UpdateUserForm() {
  return (
    <Form action={updateUser} initialData="foobar">
      {({
        error,
        data,
        validationError,
        isPending,
        isFailure,
        isInvalid,
        isSuccess,
        isInitial,
      }) => (
        <>
          {/* safely access the data or error by checking the mutually exclusive boolean flags: */}
          {isSuccess && <p className="success-message">{data}</p>}
          {isFailure && <p className="error-message">{error.message}</p>}
          <input type="text" name="name" disabled={isPending} />
          {isInvalid && (
            <span className="input-error">{validationError.name}</span>
          )}

          <button disabled={isPending}>
            {isPending ? "Submitting..." : "Submit"}
          </button>
        </>
      )}
    </Form>
  );
}
```

### Bonus `<FormStatus>`

The `useFormStatus` hook data exposed via render prop:

```tsx
import { FormStatus } from "react-form-action/client";

// <FormStatus> alleviates the need to create a separate <SubmitButton> component using the useFormStatus hook

return function MyForm() {
  return (
    <form action={action}>
      <FormStatus>
        {({ pending }) => (
          <button type="submit">{pending ? "Submitting..." : "Submit"} </button>
        )}
      </FormStatus>
    </form>
  );
};
```
