export type InitialState<T> = {
  type: "initial";
  data: T;
  error: null;
};

export type FailureState<T> = {
  type: "failure";
  data: null;
  error: T;
};

export type SuccessState<T> = {
  type: "success";
  data: T;
  error: null;
};

export type FormState<Data, Error> =
  | InitialState<Data>
  | FailureState<Error>
  | SuccessState<Data>;

export function createFormAction<Data, Error = Data, Payload = FormData>(
  formAction: (params: {
    success: (data: Data) => SuccessState<Data>;
    failure: (data: Error) => FailureState<Error>;
  }) => (
    state: FormState<Data, Error>,
    payload: Payload
  ) => Promise<FormState<Data, Error>>
) {
  function success(data: Data): SuccessState<Data> {
    return { type: "success", data, error: null };
  }
  function failure(error: Error): FailureState<Error> {
    return { type: "failure", data: null, error };
  }

  return (state: FormState<Data, Error>, payload: Payload) =>
    formAction({ success, failure })(state, payload);
}
