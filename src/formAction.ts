import { z, ZodFirstPartyTypeKind } from "zod";
import type {
  ZodType,
  ZodTypeAny,
  objectUtil,
  ZodObject,
  ZodRawShape,
  ZodSchema,
  ZodTuple,
  ZodEffects,
  AnyZodTuple,
} from "zod";
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

type ErrorHandler<Context, Err> = (params: {
  error: unknown;
  ctx: Context;
}) => Promise<Err>;

type InitialContext = Record<"formData", FormData>;

/**
 * Action without schema has no input.
 */
type Action<Data, Context, Args extends AnyZodTuple> = (params: {
  args: z.infer<Args>;
  ctx: Context;
}) => Promise<Data>;

/**
 * Action with schema will get parsed formData as the input.
 */
type SchemaAction<
  Data,
  Context,
  Args extends AnyZodTuple,
  Schema extends ZodSchema,
> = (params: {
  args: z.infer<Args>;
  ctx: Context;
  input: z.infer<Schema>;
}) => Promise<Data>;

type AnyZodEffects = ZodEffects<any, any, any>;

type FormActionBuilder<
  Schema extends ZodTypeAny | EmptyInput,
  TErr = unknown,
  Context = InitialContext,
  Args extends AnyZodTuple = ZodTuple<[], null>,
> = {
  args: <T extends [ZodTypeAny, ...ZodTypeAny[]]>(
    args: T
  ) => FormActionBuilder<Schema, TErr, Context, ZodTuple<T, null>>;
  input: <T extends ZodTypeAny>(
    newInput: T extends ZodType<infer Out extends Record<string, unknown>>
      ? Schema extends AnyZodEffects
        ? "Extending schema with effect is not possible."
        : Schema extends EmptyInput
          ? T // valid initial schema, possibly with effects
          : Schema extends ZodTypeAny
            ? T extends AnyZodEffects
              ? "Your input contains effect which prevents merging it with the previous inputs."
              : T
            : T
      : "The schema output must be an object."
  ) => FormActionBuilder<
    Schema extends ZodObject<infer O1 extends ZodRawShape>
      ? // merging won't work for effects, but that is sanitized in input parameter
        T extends ZodObject<infer O2 extends ZodRawShape>
        ? ZodObject<objectUtil.extendShape<O1, O2>>
        : never
      : T,
    TErr,
    Context,
    Args
  >;
  /**
   * A finishing call on the builder completing your action.
   * @param action async function to execute. It will receive parsed formData as input, when the builder was initialized with a schema.
   * @returns runnable server action exportable from a module.
   */
  run: Schema extends ZodTypeAny
    ? <Data>(
        action: SchemaAction<Data, Flatten<Context>, Args, Schema>
      ) => // NOTE: type is inlined, as the FormAction<...> call hinders the union discrimination by the result type
      (
        ...args: [
          ...z.infer<Args>,
          state: ActionState<
            Data,
            TErr,
            z.inferFormattedError<Schema> & z.inferFormattedError<Args>
          >,
          payload: FormData,
        ]
      ) => Promise<
        Flatten<
          | InvalidState<
              z.inferFormattedError<Schema> & z.inferFormattedError<Args>
            >
          | FailureState<TErr>
          | SuccessState<Data>
        >
      >
    : <Data>(
        action: Action<Data, Flatten<Context>, Args>
      ) => (
        ...args: [
          ...z.infer<Args>,
          state: ActionState<Data, TErr, z.inferFormattedError<Args>>,
          payload: FormData,
        ]
      ) => Promise<
        Flatten<
          | InvalidState<z.inferFormattedError<Args>>
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
    middleware: ({ ctx }: { ctx: Context }) => Promise<NewContext>
  ) => FormActionBuilder<Schema, TErr, Context & NewContext, Args>;
  /**
   * A chainable error handler to handle errors thrown while running the action passed to .run().
   * It does not receive errors thrown from the context/middleware.
   * @param processError A function which receives action's errors.
   * @returns FormActionBuilder
   */
  error: <TErr>(
    processError: ErrorHandler<Context, TErr>
  ) => FormActionBuilder<Schema, TErr, Context, Args>;
};

function formActionBuilder<
  Schema extends ZodTypeAny | EmptyInput,
  TErr = unknown,
  Context = InitialContext,
  Args extends AnyZodTuple = ZodTuple<[], null>,
>(
  schema: Schema,
  middleware: MiddlewareFn<Context>[] = [],
  processError?: ErrorHandler<Context, TErr>,
  argsSchema?: ZodTuple
): FormActionBuilder<Schema, TErr, Context, Args> {
  async function createContext(formData: FormData) {
    let ctx = { formData } as Context;

    for (const op of middleware) {
      const newCtx = await op({ ctx });
      ctx = { ...ctx, ...newCtx };
    }

    return ctx;
  }

  const run = <Data>(action: Action<Data, Context, Args>) =>
    createFormAction<
      Data,
      TErr,
      z.inferFormattedError<Args>,
      FormData,
      z.infer<Args>
    >(({ success, failure, invalid }, ...args) => {
      return async (state, formData) => {
        const ctx = await createContext(formData);

        if (argsSchema) {
          const result = argsSchema.safeParse(args);

          if (!result.success) {
            return invalid(
              result.error.format() as unknown as z.inferFormattedError<Args>
            );
          }
        }

        try {
          return success(await action({ args, ctx }));
        } catch (error) {
          if (processError) {
            return failure(await processError({ error, ctx }));
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
      : <Data>(action: SchemaAction<Data, Context, Args, RealSchema>) => {
          return createFormAction<
            Data,
            TErr,
            z.inferFormattedError<RealSchema> & z.inferFormattedError<Args>,
            FormData,
            z.infer<Args>
          >(({ success, failure, invalid }, ...args) => {
            const formDataSchema = zfd.formData(schema);

            return async (state, formData) => {
              const ctx = await createContext(formData);

              if (argsSchema) {
                const result = argsSchema.safeParse(args);

                if (!result.success) {
                  return invalid(
                    result.error.format() as unknown as z.inferFormattedError<Args>
                  );
                }
              }

              const result = formDataSchema.safeParse(formData);

              if (!result.success) {
                return invalid(
                  result.error.format() as z.inferFormattedError<RealSchema>
                );
              }

              const input = result.data as z.infer<RealSchema>;

              try {
                return success(await action({ args, input, ctx }));
              } catch (error) {
                if (processError) {
                  return failure(await processError({ error, ctx }));
                }
                // must be handled by error boundary
                throw error;
              }
            };
          });
        };

  return {
    args<Args extends [ZodTypeAny, ...ZodTypeAny[]]>(args: Args) {
      return formActionBuilder(schema, middleware, processError, z.tuple(args));
    },
    input<TInput extends ZodTypeAny>(newInput: TInput) {
      if (schema === emptyInput) {
        return formActionBuilder<TInput, TErr, Context, Args>(
          newInput,
          middleware,
          processError,
          argsSchema
        );
      } else if (schema._def.effect) {
        throw new Error(
          "Previous input is not augmentable because it contains an effect."
        );
      } else if (newInput._def.effect) {
        throw new Error(
          "Your input contains effect which prevents merging it with the previous inputs."
        );
      } else if (schema._def.typeName === ZodFirstPartyTypeKind.ZodObject) {
        // @ts-ignore
        const merged = schema.merge(newInput);

        return formActionBuilder<typeof merged, TErr, Context, Args>(
          merged,
          middleware
        );
      } else {
        throw Error(
          "Merging inputs works only for object schemas without effects."
        );
      }
    },
    use<NewContext extends Record<string, unknown>>(
      newMiddleware: ({ ctx }: { ctx: Context }) => Promise<NewContext>
    ) {
      return formActionBuilder<Schema, TErr, Context & NewContext, Args>(
        schema,
        [...middleware, newMiddleware],
        processError,
        argsSchema
      );
    },
    error<TErr>(processError: ErrorHandler<Context, TErr>) {
      return formActionBuilder<Schema, TErr, Context, Args>(
        schema,
        middleware,
        processError,
        argsSchema
      );
    },
    run: schema === emptyInput ? run : runSchema,
  } as FormActionBuilder<Schema, TErr, Context, Args>;
}

export const formAction = formActionBuilder(emptyInput);
