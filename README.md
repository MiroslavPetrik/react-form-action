# react-form-action

End-to-end typesafe success, error & validation state control for Next.js 14 form actions.

## Features

**Action Creator**

- ✅ Provides `"invalid" | "success" | "failure"` response objects.
- ✅ Define generic payload for each of the response type.

**Form Action builder**

- ✅ tRPC-like builder API for `.input(zodSchema)` & context `.use(middleware)`
- ✅ Parses `formData` with [`zod-form-data`](https://www.npmjs.com/package/zod-form-data)

**Stateful `<Form />`**

- ✅ `<Form />` component reads the action's response.
- ✅ Computes progress meta-state like `isInvalid`, `isSuccess` and more.

## Install

```
npm i react-form-action zod-form-data
```

<a aria-label="NPM version" href="https://www.npmjs.com/package/react-form-action">
  <img alt="NPM Version" src="https://img.shields.io/npm/v/react-form-action?style=for-the-badge&labelColor=24292e">
</a>

## Usage

### `formAction` builder

```ts
// app/actions/auth.ts
"use server";

import { formAction } from "react-form-action";
import { z } from "zod";
import { cookies } from "next/headers";

const i18nMiddleware = async () => {
  const { t } = await useTranslation("auth", cookies().get("i18n")?.value);
  // will be added to context
  return { t };
};

const authAction = formAction
  .use(i18nMiddleware)
  .use(async ({ ctx: { t } }) =>
    console.log("🎉 context enhanced by previous middlewares 🎉", t),
  )
  .error(({ error }) => {
    if (error instanceof DbError) {
      return error.custom.code;
    } else {
      // unknown error
      // default Next.js error handling (error.js boundary)
      throw error;
    }
  });

export const signIn = authAction
  .input(z.object({ email: z.string().email() }))
  // 🎉 extend the previous input (only without refinements and transforms)
  .input(z.object({ password: z.string() }))
  .run(async ({ ctx: { t }, input: { email, password } }) => {
    // Type inferred: {email: string, password: string}

    await db.signIn({ email, password });

    return t("verificationEmail.success");
  });

export const signUp = authAction
  .input(
    z
      .object({
        email: z.string().email(),
        password: z.string(),
        confirm: z.string(),
      })
      .refine((data) => data.password === data.confirm, {
        message: "Passwords don't match",
        path: ["confirm"],
      }),
  ) // if using refinement, only one input call is permited, as schema with ZodEffects is not extendable.
  .run(async ({ ctx: { t }, input: { email, password } }) => {
    // 🎉 passwords match!

    const tokenData = await db.signUp({ email, password });

    if (!tokenData) {
      return t("signUp.emailVerificationRequired");
    }

    return t("singUp.success");
  });
```

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
  },
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

### `<ZodFieldError>` Component

Actions created with `formAction` builder will have the `validationError` of [`ZodFormattedError`](https://zod.dev/ERROR_HANDLING?id=formatting-errors) type.
To easily access the nested error, use the helper `<ZodFieldError>` component:

```tsx
"use client";
import { Form, ZodFieldError } from "react-form-action/client";

export const signUp = authAction
  .input(
    z
      .object({
        user: z.object({
          email: z.string().email(),
          name: z.string(),
        }),
        password: z.string().min(8),
        confirm: z.string(),
      })
      .refine((data) => data.password === data.confirm, {
        message: "Passwords don't match",
      })
  )
  .run(async ({ ctx, input }) => {
    // implementation
  });

export function SignUpForm() {
  return (
    <Form action={signUp} initialData="">
      {({ isInvalid, validationError }) =>
        {/* Render ZodFieldError behind the isInvalid flag to narrow type (omits the possibility of null) */}
        isInvalid && (
          <>
            {/*
              When the "name" prop is ommited, the top-level error will be rendered e.g.:
              "Passwords don't match"
            */}
            <ZodFieldError errors={validationError} />
            {/* Access fields by their name: */}
            <ZodFieldError errors={validationError} name="password" />
            {/* Access nested fields by dot access notation: */}
            <ZodFieldError errors={validationError} name="user.email" />
          </>
        )
      }
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
