# react-form-action

## Install

```
npm i react-form-action
```

## Usage

### Server Action

```ts
// actions/updateUser.ts
"use server";
import { createFormAction } from "react-form-action";

type ErrorData = {
  message: string;
  validation?: boolean;
};

export const updateUser = createFormAction<string, ErrorData>(
  ({ success, failure }) =>
    async (prevState, formData) => {
      if (prevState.type === "initial") {
        // use the initialData passed to <Form /> here
        // state.data === "foobar"
      }

      try {
        const { name } = updateUserSchema.parse({
          name: formData.get("name"),
        });

        const user = await updateCurrentUser(name);

        if (user) {
          return success("Your profile has been updated.");
        } else {
          return failure({ message: "No current user." });
        }
      } catch (error) {
        if (error instanceof ZodError) {
          return failure({
            validation: true,
            message: error.issues[0]?.message ?? "Validation error",
          });
        }

        return failure({ message: "Failed to update user." });
      }
    }
);
```

### Form Component

```tsx
"use client";
import { Form } from "react-form-action";

import { updateUser } from "@/actions";

export function UpdateUserForm() {
  return (
    <Form action={updateUser} initialData="foobar">
      {({ error, data, isPending, isFailure, isSuccess, isInitial }) => (
        <>
          {isSuccess && <p className="success-message">{data}</p>}

          {isFailure && !error.validation &&  <p className="error-message">{error.message}</p>}

          <input type="text" name="name" disabled={isPending} />
          {isFailure && error.validation && <span>{error.message}</label>}

          <button disabled={isPending}>
            {isPending ? "Submitting..." : "Submit"}
          </button>
        </>
      )}
    </Form>
  );
}
```
