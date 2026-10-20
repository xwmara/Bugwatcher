// Logs one line per request. The request body is never logged,
// because it can contain passwords and personal data.
export const apiAudit = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);

    next();
}
