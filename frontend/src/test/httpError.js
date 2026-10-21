// Builds an error shaped like the ones axios throws for HTTP error responses.
export const httpError = (status, message) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data: message ? { message } : {} },
  });

// Builds an error like the one axios throws when the server cannot be reached.
export const networkError = () => new Error('Network Error');
