// Checks req.params and req.body against zod schemas (see validation/schemas.js).
// Invalid requests get a 400 with the first error as "message" and the full list in "errors".
// Valid data replaces the original, so controllers receive clean values
// (trimmed text, numbers instead of strings, unknown fields removed).
export const validate = ({ params, body } = {}) => (req, res, next) => {
    const issues = [];

    if (params) {
        const result = params.safeParse(req.params);
        if (result.success) Object.assign(req.params, result.data);
        else issues.push(...result.error.issues);
    }

    if (body) {
        const result = body.safeParse(req.body ?? {});
        if (result.success) req.body = result.data;
        else issues.push(...result.error.issues);
    }

    if (issues.length > 0) {
        return res.status(400).json({
            message: issues[0].message,
            errors: issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
        });
    }

    next();
};
