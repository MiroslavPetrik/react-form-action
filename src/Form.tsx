import type { FormHTMLAttributes } from "react";
import type { RenderProp } from "react-render-prop-type";
import type {
  FormState,
  InitialState,
  FailureState,
  SuccessState,
} from "./createFormAction";
import { useFormState } from "react-dom";
import { FormStatus } from "./FormStatus";

type FormStateProps<Data, Error, Payload> = {
  action: (
    state: FormState<Data, Error>,
    payload: Payload
  ) => Promise<FormState<Data, Error>>;
  initialData: Data;
  permalink?: string;
};

function initial<Data>(data: Data): InitialState<Data> {
  return { type: "initial", data, error: null };
}

type FormMetaState<T extends FormState<unknown, unknown>> = T & {
  isPending: boolean;
  isInitial: T["type"] extends "initial" ? true : false;
  isFailure: T["type"] extends "failure" ? true : false;
  isSuccess: T["type"] extends "success" ? true : false;
};

export function Form<Data, Error>({
  children,
  action,
  initialData,
  permalink,
  ...props
}: Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "children"> &
  FormStateProps<Data, Error, FormData> &
  RenderProp<
    | FormMetaState<InitialState<Data>>
    | FormMetaState<FailureState<Error>>
    | FormMetaState<SuccessState<Data>>
  >) {
  const [state, formAction] = useFormState(
    action,
    initial(initialData),
    permalink
  );

  return (
    <form action={formAction} {...props}>
      <FormStatus>
        {({ pending }) =>
          children(
            // @ts-expect-error its fine
            {
              ...state,
              isPending: pending,
              isInitial: state.type === "initial",
              isFailure: state.type === "failure",
              isSuccess: state.type === "success",
            }
          )
        }
      </FormStatus>
    </form>
  );
}
