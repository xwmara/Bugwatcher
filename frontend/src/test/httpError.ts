// Builds an error shaped like the ones axios throws for HTTP error responses.
export const httpError = (status: number, message?: string) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, data: message ? { message } : {} },
  });

// Builds an error like the one axios throws when the server cannot be reached
// (an axios error without a response).
export const networkError = () =>
  Object.assign(new Error('Network Error'), { isAxiosError: true, response: undefined });
