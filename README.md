# react-form-action

End-to-end typesafe success, error & validation state control for Next.js form actions.

## Features

**Action Creator**

- ✅ Provides envelope objects with `"initial" | "invalid" | "success" | "failure"` response types.
- ✅ Define generic payload for each of the response type.
- ✅ Bind action arguments.

**tRPC-like Form Action builder**

- ✅ Define payload schema with the `.input(zodSchema)` to validate the `formData`
- ✅ Reuse business logic with the `.use(middleware)` method.
- ✅ Define bindable arguments with the `.args([])` method.
- ✅ Reuse error handling with the `.error(handler)`.

**React Context access with the `<Action action={myFormAction} />` component**

- ✅ The `useActionState()` accessible via the `useActionContext()` hook.
- ✅ Computes progress flags like `isInvalid`, `isSuccess` based on the envelope type.

**Context-bound `<Form />` component**

- ✅ Reads the `action` from the `<Action />` context.
- ✅ Opt-out from the default form reset after action submit.

## Install

```
npm i react-form-action zod-form-data
```

<a aria-label="NPM version" href="https://www.npmjs.com/package/react-form-action">
  <img alt="NPM Version" src="https://img.shields.io/npm/v/react-form-action?style=for-the-badge&labelColor=24292e">
</a>

## Getting Started

#### 1️⃣ Create a Server Action

```tsx
// app/subscribe/action.ts
"use server";

import { formAction } from "react-form-action";
import { z } from "zod";

export const subscribeAction = formAction
  .input(z.object({ email: z.email() }))
  .run(async ({ input }) => {
    return input.email;
  });
```

#### 2️⃣ Create a Client Form Component

```tsx
// app/subscribe/form.tsx
"use client";

import {
  Form,
  Pending,
  createComponents,
  useActionContext,
} from "react-form-action/client";

import { subscribeAction } from "./action";

const { FieldError, Success } = createComponents(subscribeAction);

export function SubscribeForm() {
  const { isPending, isFailure, error, data } =
    useActionContext(subscribeAction);

  return (
    <Form>
      <Success>
        <p>✅ Email {data} was registered.</p>
      </Success>
      {/*💡 The FieldError "name" prop supports autocompletion */}
      <FieldError name="email">
        {({ name, error }) => (
          <input className={error ? "invalid" : ""} name={name} />
        )}
      </FieldError>
      <button type="submit" disabled={isPending}>
        {isPending ? "🌀 Submitting..." : "Submit"}
      </button>
      <Pending>Please wait...</Pending>
    </Form>
  );
}
```

#### 3️⃣ Provide the `<Action>` context on a Page

```tsx
// app/subscribe/page.tsx

import { Action } from "react-form-action/client";

import { subscribeAction } from "./action";
import { SubscribeForm } from "./form";

export default function Page() {
  return (
    <Action action={subscribeAction} initialData="">
      <SubscribeForm />
    </Action>
  );
}
```

## Usage

### `formAction` builder

The [`zod-form-data`](https://www.npmjs.com/package/zod-form-data) powered action builder.

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
  .error(async ({ error }) => {
    if (error instanceof DbError) {
      return error.custom.code;
    } else {
      // unknown error
      // default Next.js error handling (error.js boundary)
      throw error;
    }
  });

export const signIn = authAction
  .input(z.object({ email: z.email() }))
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
        email: z.email(),
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

#### Args binding

The `formAction` builder supports action arguments binding:

```ts
// app/[locale]/update-user/[userId]/action.tsx
import { formAction } from "react-form-action";

export const updateUser = formAction
  .args([z.string().uuid(), z.enum("fr", "en")])
  .run(async ({ args: [userId] }) => {
    return userId;
    //     ^? string
  })
  .error(({ args: [_, locale] }) => {
    return locale === "fr"
      ? "Échec de la mise à jour de l'utilisateur"
      : "Failed to update user";
  });
```

```tsx
// app/[locale]/update-user/[userId]/page.tsx
import { Action } from "react-form-action/client";

import { locale as localeParam } from "next/root-params";
import { updateUser } from "./action";
import { UpdateUserForm } from "./form";

export default function Page({
  params,
}: PageProps<"/[locale]/update-user/[userId]">) {
  const locale = await localeParam();
  const { userId } = await params;

  return (
    <Action action={updateUser} args={[await localeParam()]} initialData="">
      <SubscribeForm />
    </Action>
  );
}
```

### Action Creator

Low-level action creator, which provides the `success`, `failure` and `invalid` envelope constructors. With the `createFormAction` you must handle the native `FormData` by yourself.

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

The action creator supports arguments binding:

```ts
export const updateUser = createFormAction(
  (
    { success, failure, invalid },
    userId: string /* Here you can specify multiple arguments */,
  ) =>
    async (prevState, formData) => {
      try {
        const { name } = updateUserSchema.parse({
          name: formData.get("name"),
        });

        const user = await db.users.findById(userId);

        if (!user) {
          return failure({ message: "No such user." });
        }

        const updated = await user.update({ name });

        if (updated) {
          return success({
            message: "User has been updated.",
          });
        } else {
          return failure({ message: "Failed to update." });
        }
      } catch (error) {
        // handle error
      }
    },
);

// call bind as usuall, the "123" becomes the "userId"
updateUser.bind(null, "123");
```

### Action Context

The `<Action>` components enables you to access your `action`'s state with the `useActionContext()` hook:

```tsx
// 👉 Define standalone client form component (e.g. /app/auth/signup/SignUpForm.tsx)
"use client";

import { Action, Form, useActionContext } from "react-form-action/client";
import type { PropsWithChildren } from "react";

import { signupAction } from "./action";

function Pending({ children }: PropsWithChildren) {
  // read any state from the ActionContext:
  const {
    error,
    data,
    validationError,
    isPending,
    isFailure,
    isInvalid,
    isSuccess,
    isInitial,
  } = useActionContext();

  return isPending && children;
}

// 💡 render this form on your RSC page (/app/auth/signup/page.tsx)
export function SignupForm() {
  return (
    <Action action={signupAction}>
      <Form>
        <input name="email" />
        <input name="password" />
      </Form>
      {/* 🎆 Read the pending state outside the <Form> */}
      <Pending>
        {/* This renders only when the action is pending. 😎 */}
        <p>Please wait...</p>
      </Pending>
    </Action>
  );
}
```

### `<Form>` Component

The `<form>` submits the action in `onSubmit` handler to [prevent automatic form reset](https://github.com/facebook/react/issues/29034).
Pass `autoReset` prop to use the `action` prop instead and keep the default reset.

```tsx
"use client";

import { Action, Form } from "react-form-action/client";

import { updateUser } from "./action";

export function UpdateUserForm() {
  return (
    <Action action={updateUser}>
      <Form autoReset>{/* ... */}</Form>
    </Action>
  );
}
```

### Context Bound Components `createComponents()`

Use the `createComponents(action)` helper to create components which use the ActionContext and have types bound to the action type.

#### `<FielError>` Component

```tsx
"use client";

// ⚠️ createComponents is usable only in "use client" components
import { Form, createComponents } from "react-form-action/client";

import { authAction } from "./actions";

export const signUpAction = authAction
  .input(
    z
      .object({
        user: z.object({
          email: z.email(),
          name: z.string(),
        }),
        password: z.string().min(8),
        confirm: z.string(),
      })
      .refine((data) => data.password === data.confirm, {
        message: "Passwords don't match",
      }),
  )
  .run(async ({ ctx, input }) => {
    return null;
  });

// 🌟 The FieldError is now bound do the signUpAction input schema which allows autocompletion for its "name" prop
// ⚠️ Usable only with actions created with the formAction builder
const { FieldError } = createComponents(signUpAction);

export function SignUpForm() {
  return (
    <Action action={signUpAction} initialData={null}>
      <Form>
        {/* 1️⃣ When the "name" prop is an empty string, the top-level error will be rendered e.g.:
          "Passwords don't match" */}
        <FieldError name="" />
        {/* 2️⃣ Access fields by their name: */}
        <FieldError name="password" />
        <FieldError name="confirm" />
        {/* 3️⃣ Access nested fields by dot access notation: */}
        <FieldError name="user.email" />
      </Form>
    </Action>
  );
}
```

#### `<Success>`

#### When children are JSX

```tsx
import { Action, createComponents } from "react-form-action/client";

const { Success } = createComponents(signUpAction);

function MyForm() {
  return (
    <Action action={signUpAction}>
      <Success>
        {/* 👉 The message will render only after the action has succeeded */}
        <p>You've been signed up!</p>
      </Success>
    </Action>
  );
}
```

#### When children is a render prop

```tsx
import { createComponents } from "react-form-action/client";

const { Success } = createComponents(signUpAction);

function Label({children}: PropsWithChildren) {
  return (
    <Success>
      {({ isSuccess, data }) => (
        {/* 👉 With a render prop, the children are always mounted, regardles of the isSuccess flag */}
        <label className={isSuccess ? "green" : ""}>
          {children}
        </label>
      )}
    </Success>
  );
};
```

### `<Pending>`

Render children when the action is pending:

#### When children are JSX

```tsx
import { Action, Pending } from "react-form-action/client";

import { Spinner } from "./components";

function MyForm() {
  return (
    <Action action={action}>
      {/* 👉 Unlike the React.useFormStatus() hook, we don't need here the <form> element at all. */}
      <Pending>
        {/* 👉 The spinner will UNMOUNT when the action is NOT pending */}
        <Spinner />
      </Pending>
    </Action>
  );
}
```

#### When children is a render prop

```tsx
import { Pending } from "react-form-action/client";

function SubmitButton() {
  return (
    <Pending>
      {({ isPending }) => (
        {/* 👉 With a render prop, the children are always mounted, regardles of the isPending flag */}
        <button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit"}
        </button>
      )}
    </Pending>
  );
};
```
