import { z, ZodFirstPartyTypeKind } from "zod";
import type {
  ZodType,
  ZodTypeAny,
  objectUtil,
  ZodObject,
  ZodRawShape,
  ZodSchema,
  ZodEffects,
} from "zod";
import {
  createFormAction,
  FailureState,
  InvalidState,
  SuccessState,
  FormState,
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
  NewContext extends Record<string, unknown> = Record<string, unknown>
> = ({ ctx }: { ctx: Context }) => Promise<NewContext>;

type InitialContext = Record<"formData", FormData>;

/**
 * Action without schema has no input.
 */
type Action<Data, Context> = (params: { ctx: Context }) => Promise<Data>;

/**
 * Action with schema will get parsed formData as the input.
 */
type SchemaAction<Data, Context, Schema extends ZodSchema> = (params: {
  ctx: Context;
  input: z.infer<Schema>;
}) => Promise<Data>;

type EmptyZodObject = ZodObject<ZodRawShape>;

type AnyZodEffects = ZodEffects<any, any, any>;

type FormActionBuilder<
  Schema extends ZodTypeAny | EmptyInput,
  Err = Error,
  Context = InitialContext
> = {
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
    Err,
    Context
  >;
  /**
   * A finishing call on the builder completing your action.
   * @param action async function to execute. It will receive parsed formData as input, when the builder was initialized with a schema.
   * @returns runnable server action exportable from a module.
   */
  run: Schema extends ZodTypeAny
    ? <Data>(
        action: SchemaAction<Data, Context, Schema>
      ) => (
        state: FormState<Data, Err, z.inferFlattenedErrors<Schema>>,
        payload: FormData
      ) => Promise<
        Flatten<
          | InvalidState<z.inferFlattenedErrors<Schema>>
          | FailureState<Err>
          | SuccessState<Data>
        >
      >
    : <Data>(
        action: Action<Data, Context>
      ) => (
        state: FormState<Data, Err>,
        payload: FormData
      ) => Promise<Flatten<FailureState<Err> | SuccessState<Data>>>;
  /**
   * A chainable context enhancing helper.
   * @param middleware A function which receives the current context, and returns an object which will be added to the context.
   * @returns FormActionBuilder
   */
  use: <NewContext extends Record<string, unknown>>(
    middleware: ({ ctx }: { ctx: Context }) => Promise<NewContext>
  ) => FormActionBuilder<Schema, Err, Context & NewContext>;
  /**
   * A chainable error handler to handle errors thrown while running the action passed to .run().
   * It does not receive errors thrown from the context/middleware.
   * @param processError A function which receives action's errors.
   * @returns FormActionBuilder
   */
  error: <Err>(
    processError: (params: { error: unknown; ctx: Context }) => Err
  ) => FormActionBuilder<Schema, Err, Context>;
};

function formActionBuilder<
  Schema extends ZodTypeAny | EmptyInput,
  Err = Error,
  Context = InitialContext,
  NewContext extends Record<string, unknown> = Record<string, unknown>
>(
  schema: Schema,
  middleware: MiddlewareFn<Context, NewContext>[] = [],
  processError?: (params: { error: unknown; ctx: Context }) => Err
): FormActionBuilder<Schema, Err, Context> {
  async function createContext(formData: FormData) {
    let ctx = { formData } as Context;

    for (const op of middleware) {
      const newCtx = await op({ ctx });
      ctx = { ...ctx, ...newCtx };
    }

    return ctx;
  }

  const run = <Data>(action: Action<Data, Context>) =>
    createFormAction<Data, Err>(({ success, failure }) => {
      return async (state, formData) => {
        const ctx = await createContext(formData);

        try {
          return success(await (action as Action<Data, Context>)({ ctx }));
        } catch (error) {
          if (processError) {
            return failure(processError({ error, ctx }));
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
      : <Data>(action: SchemaAction<Data, Context, RealSchema>) => {
          return createFormAction<
            Data,
            Err,
            z.inferFlattenedErrors<RealSchema>
          >(({ success, failure, invalid }) => {
            const formDataSchema = zfd.formData(schema);

            return async (state, formData) => {
              const ctx = await createContext(formData);
              const result = formDataSchema.safeParse(formData);

              if (!result.success) {
                return invalid(result.error.flatten());
              }

              const input = result.data as z.infer<RealSchema>;

              try {
                return success(await action({ input, ctx }));
              } catch (error) {
                if (processError) {
                  return failure(processError({ error, ctx }));
                }
                // must be handled by error boundary
                throw error;
              }
            };
          });
        };

  return {
    input<T extends ZodTypeAny>(newInput: T) {
      if (schema === emptyInput) {
        return formActionBuilder<T, Err, Context & NewContext>(
          newInput,
          middleware
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

        return formActionBuilder<typeof merged, Err, Context & NewContext>(
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
      return formActionBuilder<Schema, Err, Context & NewContext>(schema, [
        ...middleware,
        newMiddleware,
      ]);
    },
    error<Err>(
      processError: (params: { error: unknown; ctx: Context }) => Err
    ) {
      return formActionBuilder<Schema, Err, Context>(
        schema,
        middleware,
        processError
      );
    },
    run: schema === emptyInput ? run : runSchema,
  } as FormActionBuilder<Schema, Err, Context>;
}

export const formAction = formActionBuilder(emptyInput);
