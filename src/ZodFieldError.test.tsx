import React from "react";
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { z } from "zod";

import { ZodFieldError } from "./ZodFieldError";

describe("ZodFieldError", () => {
  test("renders top level error when the name prop not provided", () => {
    const passwordForm = z
      .object({
        password: z.string(),
        confirm: z.string(),
      })
      .refine((data) => data.password === data.confirm, {
        message: "Passwords don't match",
      });

    const result = passwordForm.safeParse({
      password: "yay",
      confirm: "nay",
    });

    render(!result.success && <ZodFieldError errors={result.error.format()} />);

    expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
  });

  test("renders field error for simple name", () => {
    const passwordForm = z.object({
      password: z.string().min(6),
      confirm: z.string(),
    });

    const result = passwordForm.safeParse({
      password: "heslo",
    });

    render(
      !result.success && (
        <ZodFieldError errors={result.error.format()} name="password" />
      )
    );

    expect(
      screen.getByText("String must contain at least 6 character(s)")
    ).toBeInTheDocument();
  });

  test("renders field error for nested field", () => {
    const creditCard = z.object({
      exp: z.object({
        month: z.number(),
        year: z.number(),
      }),
      cvc: z.number(),
    });

    const result = creditCard.safeParse({
      exp: {
        month: 10,
      },
      cvc: 123,
    });

    render(
      !result.success && (
        <ZodFieldError errors={result.error.format()} name="exp.year" />
      )
    );

    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  test("renders nothing for non-existent (non-error) field", () => {
    const str = z.string();
    const result = str.safeParse(1);

    render(
      !result.success && (
        // @ts-expect-error deliberate invalid
        <ZodFieldError errors={result.error.format()} name="invalid">
          {({ errors }) => (errors.length ? "fail" : "success")}
        </ZodFieldError>
      )
    );

    expect(screen.getByText("success")).toBeInTheDocument();
  });
});
