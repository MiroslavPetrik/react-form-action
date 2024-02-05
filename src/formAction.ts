import { z, type objectUtil, ZodObject, ZodRawShape, ZodSchema } from "zod";
import {
  createFormAction,
  FailureState,
  InvalidState,
  SuccessState,
  FormState,
} from "./createFormAction";
import { zfd } from "zod-form-data";

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

type FormActionBuilder<
  Schema extends EmptyZodObject,
  Err = Error,
  Context = InitialContext
> = {
  input: <T extends ZodRawShape>(
    schema: ZodObject<T>
  ) => FormActionBuilder<
    ZodObject<objectUtil.extendShape<T, Schema["shape"]>>,
    Err,
    Context
  >;
  /**
   * A finishing call on the builder completing your action.
   * @param action async function to execute. It will receive parsed formData as input, when the builder was initialized with a schema.
   * @returns runnable server action exportable from a module.
   */
  run: Schema extends undefined
    ? <Data>(
        action: Action<Data, Context>
      ) => (
        state: FormState<Data, Err>,
        payload: FormData
      ) => Promise<Flatten<FailureState<Err> | SuccessState<Data>>>
    : <Data>(
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
      >;
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
  Input extends ZodRawShape,
  Schema extends EmptyZodObject = ZodObject<Input>,
  Err = Error,
  Context = InitialContext,
  NewContext extends Record<string, unknown> = Record<string, unknown>
>(
  schema: Schema,
  /**
   * @private
   */
  middleware: MiddlewareFn<Context, NewContext>[] = [],
  /**
   * @private
   */
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

  const runSchema = <Data>(action: SchemaAction<Data, Context, Schema>) => {
    return createFormAction<Data, Err, z.inferFlattenedErrors<Schema>>(
      ({ success, failure, invalid }) => {
        const formDataSchema = zfd.formData(schema);

        return async (state, formData) => {
          const ctx = await createContext(formData);
          const result = formDataSchema.safeParse(formData);

          if (!result.success) {
            return invalid(result.error.flatten());
          }

          const input = result.data as z.infer<Schema>;

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
      }
    );
  };

  return {
    input<T extends ZodRawShape>(newInput: ZodObject<T>) {
      const merged = schema.merge(newInput);

      return formActionBuilder<
        (typeof merged)["shape"],
        typeof merged,
        Err,
        Context & NewContext
      >(merged, middleware);
    },
    use<NewContext extends Record<string, unknown>>(
      newMiddleware: ({ ctx }: { ctx: Context }) => Promise<NewContext>
    ) {
      return formActionBuilder<Input, Schema, Err, Context & NewContext>(
        schema,
        [...middleware, newMiddleware]
      );
    },
    error<Err>(
      processError: (params: { error: unknown; ctx: Context }) => Err
    ) {
      return formActionBuilder<Input, Schema, Err, Context>(
        schema,
        middleware,
        processError
      );
    },
    run: Object.keys(schema.shape).length === 0 ? run : runSchema,
  } as FormActionBuilder<Schema, Err, Context>;
}

export const formAction = formActionBuilder(z.object({}));
