/**
 * This action expects to be passed to useActionState after one .bind() call.
 * @param userId A parameter to bind.
 * @param _state previous state from useActionState
 * @param formData payload
 */
export function updateUser(
  userId: string,
  _state: unknown,
  formData: FormData
) {
  return {
    userId,
    name: formData.get("name"),
  };
}
