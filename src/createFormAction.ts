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
  Arguments extends unknown[] = [],
> = (
  ...args: [
    ...Arguments,
    state: ActionState<Data, Error, ValidationError>,
    payload: Payload,
  ]
) => Promise<ActionState<Data, Error, ValidationError>>;

export function initial<Data>(data: Data): InitialState<Data> {
  return { type: "initial", data, error: null, validationError: null };
}

export function createFormAction<
  Data,
  Error = Data,
  ValidationError = Record<string, never>,
  Payload = FormData,
  Arguments extends [...unknown[]] = [],
>(
  formAction: (
    params: {
      success: (data: Data) => SuccessState<Data>;
      failure: (error: Error) => FailureState<Error>;
      invalid: (
        validationError: ValidationError
      ) => InvalidState<ValidationError>;
    },
    ...args: Arguments
  ) => FormAction<Data, Error, ValidationError, Payload>
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

  return (
    ...args: [
      ...Arguments,
      state: ActionState<Data, Error, ValidationError>,
      payload: Payload,
    ]
  ) => {
    const [payload, state, ...boundArgs] = args.reverse() as [
      payload: Payload,
      state: ActionState<Data, Error, ValidationError>,
      ...Arguments,
    ];

    return formAction({ success, failure, invalid }, ...boundArgs)(
      state,
      payload
    );
  };
}
