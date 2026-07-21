import { z } from "zod/v4";
import type { $ZodErrorTree, $ZodShape, $ZodType } from "zod/v4/core";
import type { ZodType, ZodObject, ZodTuple } from "zod/v4";
import {
  createFormAction,
  FailureState,
  InvalidState,
  SuccessState,
  ActionState,
} from "./createFormAction";
import { zfd } from "zod-form-data";

const emptyInput = Symbol();

type EmptyInput = typeof emptyInput;

type Flatten<T> = Identity<{
  [K in keyof T]: T[K];
}>;

type Identity<T> = T;

type MiddlewareFn<
  Context,
  NewContext extends Record<string, unknown> = Record<string, unknown>,
> = ({ ctx }: { ctx: Context }) => Promise<NewContext>;

type ErrorHandler<Context, Err, Args> = (params: {
  error: unknown;
  ctx: Context;
  args: Args;
}) => Promise<Err>;

type InitialContext = Record<"formData", FormData>;

/**
 * Action without schema has no input.
 */
type Action<Data, Context, Args extends unknown[]> = (params: {
  args: Args;
  ctx: Context;
}) => Promise<Data>;

/**
 * Action with schema will get parsed formData as the input.
 */
type SchemaAction<
  Data,
  Context,
  Args extends unknown[],
  Schema extends ZodType,
> = (params: {
  args: Args;
  ctx: Context;
  input: z.output<Schema>;
}) => Promise<Data>;

// type AnyZodEffects = ZodEffects<any, any, any>;

type FormActionBuilder<
  Schema extends ZodType | EmptyInput,
  Args extends $ZodType[] = [],
  TErr = unknown,
  Context = InitialContext,
  PlainArgs extends unknown[] = z.output<ZodTuple<Args, null>>,
> = {
  args: <T extends [$ZodType, ...$ZodType[]]>(
    args: T,
  ) => FormActionBuilder<Schema, [...Args, ...T], TErr, Context>;
  input: <T extends ZodObject>(
    newInput: T extends ZodObject
      ? T
      : // ? Schema extends AnyZodEffects
        //   ? "Extending schema with effect is not possible."
        //   : Schema extends EmptyInput
        //     ? T // valid initial schema, possibly with effects
        //     : Schema extends ZodType
        //       ? T extends AnyZodEffects
        //         ? "Your input contains effect which prevents merging it with the previous inputs."
        //         : T
        //       : T
        "The schema output must be an object.",
  ) => FormActionBuilder<
    Schema extends ZodObject<infer O1 extends $ZodShape>
      ? // merging won't work for effects, but that is sanitized in input parameter
        T extends ZodObject<infer O2 extends $ZodShape>
        ? ZodObject<O1 & O2>
        : never
      : T,
    Args,
    TErr,
    Context
  >;
  /**
   * A finishing call on the builder completing your action.
   * @param action async function to execute. It will receive parsed formData as input, when the builder was initialized with a schema.
   * @returns runnable server action exportable from a module.
   */
  run: Schema extends ZodType
    ? <Data>(
        action: SchemaAction<Data, Flatten<Context>, PlainArgs, Schema>,
      ) => // NOTE: type is inlined, as the FormAction<...> call hinders the union discrimination by the result type
      (
        ...args: [
          ...PlainArgs,
          state: ActionState<
            Data,
            TErr,
            $ZodErrorTree<z.output<Schema>> & $ZodErrorTree<PlainArgs>
          >,
          payload: FormData,
        ]
      ) => Promise<
        Flatten<
          | InvalidState<
              $ZodErrorTree<z.output<Schema>> & $ZodErrorTree<PlainArgs>
            >
          | FailureState<TErr>
          | SuccessState<Data>
        >
      >
    : <Data>(
        action: Action<Data, Flatten<Context>, PlainArgs>,
      ) => (
        ...args: [
          ...PlainArgs,
          state: ActionState<Data, TErr, $ZodErrorTree<PlainArgs>>,
          payload: FormData,
        ]
      ) => Promise<
        Flatten<
          | InvalidState<$ZodErrorTree<PlainArgs>>
          | FailureState<TErr>
          | SuccessState<Data>
        >
      >;
  /**
   * A chainable context enhancing helper.
   * @param middleware A function which receives the current context, and returns an object which will be added to the context.
   * @returns FormActionBuilder
   */
  use: <NewContext extends Record<string, unknown>>(
    middleware: ({ ctx }: { ctx: Context }) => Promise<NewContext>,
  ) => FormActionBuilder<Schema, Args, TErr, Context & NewContext>;
  /**
   * A chainable error handler to handle errors thrown while running the action passed to .run().
   * It does not receive errors thrown from the context/middleware.
   * @param processError A function which receives action's errors.
   * @returns FormActionBuilder
   */
  error: <TErr>(
    processError: ErrorHandler<Context, TErr, PlainArgs>,
  ) => FormActionBuilder<Schema, Args, TErr, Context>;
};

function formActionBuilder<
  Schema extends ZodType | EmptyInput,
  Args extends $ZodType[] = [],
  TErr = unknown,
  Context = InitialContext,
  PlainArgs extends unknown[] = z.output<ZodTuple<Args, null>>,
>(
  schema: Schema,
  middleware: MiddlewareFn<Context>[] = [],
  processError?: ErrorHandler<Context, TErr, PlainArgs>,
  argsSchema?: Args,
): FormActionBuilder<Schema, Args, TErr, Context> {
  async function createContext(formData: FormData) {
    let ctx = { formData } as Context;

    for (const op of middleware) {
      const newCtx = await op({ ctx });
      ctx = { ...ctx, ...newCtx };
    }

    return ctx;
  }

  const run = <Data>(action: Action<Data, Context, PlainArgs>) =>
    createFormAction<
      Data,
      TErr,
      $ZodErrorTree<z.output<Args>>,
      FormData,
      PlainArgs
    >(({ success, failure, invalid }, ...args) => {
      return async (state, formData) => {
        const ctx = await createContext(formData);

        if (argsSchema) {
          // @ts-expect-error args have 1 or more elements here
          const result = z.tuple(argsSchema).safeParse(args);

          if (!result.success) {
            return invalid(
              z.treeifyError(result.error) as $ZodErrorTree<z.output<Args>>,
            );
          }
        }

        try {
          return success(await action({ args, ctx }));
        } catch (error) {
          if (processError) {
            return failure(await processError({ args, error, ctx }));
          }
          // must be handled by error boundary
          throw error;
        }
      };
    });

  // hotfix
  type RealSchema = Exclude<Schema, EmptyInput>;

  const runSchema =
    schema === emptyInput
      ? undefined
      : <Data>(action: SchemaAction<Data, Context, PlainArgs, RealSchema>) => {
          return createFormAction<
            Data,
            TErr,
            $ZodErrorTree<z.output<RealSchema>> | $ZodErrorTree<PlainArgs>,
            FormData,
            PlainArgs
          >(({ success, failure, invalid }, ...args) => {
            const formDataSchema = zfd.formData(schema);

            return async (state, formData) => {
              const ctx = await createContext(formData);

              if (argsSchema) {
                // @ts-expect-error args have 1 or more elements here
                const result = z.tuple(argsSchema).safeParse(args);

                if (!result.success) {
                  return invalid(
                    z.treeifyError(result.error) as $ZodErrorTree<PlainArgs>,
                  );
                }
              }

              const result = formDataSchema.safeParse(formData);

              if (!result.success) {
                return invalid(
                  z.treeifyError(result.error) as $ZodErrorTree<
                    z.output<RealSchema>
                  >,
                );
              }

              const input = result.data as z.infer<RealSchema>;

              try {
                return success(await action({ args, input, ctx }));
              } catch (error) {
                if (processError) {
                  return failure(await processError({ args, error, ctx }));
                }
                // must be handled by error boundary
                throw error;
              }
            };
          });
        };

  return {
    args<T extends [$ZodType, ...$ZodType[]]>(newArgs: T) {
      const args = argsSchema ? [...argsSchema, ...newArgs] : newArgs;

      return formActionBuilder(schema, middleware, processError, args);
    },
    input<TInput extends ZodObject>(newInput: TInput) {
      if (schema === emptyInput) {
        return formActionBuilder(
          newInput,
          middleware,
          processError,
          argsSchema,
        );
      } else if (schema._zod.def.checks) {
        throw new Error(
          "Previous input is not augmentable because it contains an effect.",
        );
      } else if (newInput._zod.def.checks) {
        throw new Error(
          "Your input contains effect which prevents merging it with the previous inputs.",
        );
      } else if (schema._zod.def.type === "object") {
        const merged = z.object({
          ...(schema as ZodObject).shape,
          ...newInput.shape,
        });

        return formActionBuilder<typeof merged, Args, TErr, Context>(
          merged,
          middleware,
        );
      } else {
        throw Error(
          "Merging inputs works only for object schemas without effects.",
        );
      }
    },
    use<NewContext extends Record<string, unknown>>(
      newMiddleware: ({ ctx }: { ctx: Context }) => Promise<NewContext>,
    ) {
      return formActionBuilder(
        schema,
        [...middleware, newMiddleware],
        processError,
        argsSchema,
      );
    },
    error<TErr>(processError: ErrorHandler<Context, TErr, PlainArgs>) {
      return formActionBuilder(schema, middleware, processError, argsSchema);
    },
    run: schema === emptyInput ? run : runSchema,
  } as unknown as FormActionBuilder<Schema, Args, TErr, Context>;
}

export const formAction = formActionBuilder(emptyInput);
