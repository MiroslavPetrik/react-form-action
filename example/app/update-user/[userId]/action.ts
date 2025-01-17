import { createFormAction } from "react-form-action";

type Data = { userId: string };

type Error = { message: string };

// TODO: the generics are not inferring
export const updateUser = createFormAction<
  Data,
  Error,
  Record<string, never>,
  FormData,
  [string]
>(({ success, failure }, userId: string) => async () => {
  if (parseInt(userId) === 9) {
    return success({ userId } as Data);
  } else {
    return failure({ message: `User with id=${userId} not found` });
  }
});
