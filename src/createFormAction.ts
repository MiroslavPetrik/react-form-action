export type InitialState<T> = {
  type: "initial";
  data: T;
  error: null;
  validationError: null;
};

export type InvalidState<T> = {
  type: "invalid";
  data: null;
  error: null;
  validationError: T;
};

export type FailureState<T> = {
  type: "failure";
  data: null;
  error: T;
  validationError: null;
};

export type SuccessState<T> = {
  type: "success";
  data: T;
  error: null;
  validationError: null;
};

export type ActionState<Data, Error, ValidationError = Record<string, never>> =
  | InitialState<Data>
  | InvalidState<ValidationError>
  | FailureState<Error>
  | SuccessState<Data>;

export type FormAction<
  Data,
  Error = Data,
  ValidationError = Record<string, never>,
  Payload = FormData,
> = (
  state: ActionState<Data, Error, ValidationError>,
  payload: Payload
) => Promise<ActionState<Data, Error, ValidationError>>;

export function initial<Data>(data: Data): InitialState<Data> {
  return { type: "initial", data, error: null, validationError: null };
}

export function createFormAction<
  Data,
  Error = Data,
  ValidationError = Record<string, never>,
  Payload = FormData,
>(
  formAction: (params: {
    success: (data: Data) => SuccessState<Data>;
    failure: (error: Error) => FailureState<Error>;
    invalid: (
      validationError: ValidationError
    ) => InvalidState<ValidationError>;
  }) => FormAction<Data, Error, ValidationError, Payload>
) {
  function success(data: Data): SuccessState<Data> {
    return { type: "success", data, error: null, validationError: null };
  }
  function failure(error: Error): FailureState<Error> {
    return { type: "failure", data: null, error, validationError: null };
  }
  function invalid(
    validationError: ValidationError
  ): InvalidState<ValidationError> {
    return { type: "invalid", data: null, error: null, validationError };
  }

  return (state: ActionState<Data, Error, ValidationError>, payload: Payload) =>
    formAction({ success, failure, invalid })(state, payload);
}
