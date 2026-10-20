// Central error handler. Controllers call next(err) for unexpected errors.
// The full error is logged on the server; the client only gets a generic message,
// so database details and stack traces are never exposed.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
    // Errors from express.json(), e.g. malformed JSON or a body that is too large
    if (err.type && err.status && err.status < 500) {
        return res.status(err.status).json({ message: "Invalid request body." });
    }

    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
    return res.status(500).json({ message: "Internal server error." });
};
