const { z, ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * Middleware factory for Zod schema validation
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {string} source - 'body' | 'query' | 'params'
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const parsed = schema.parse(data);
      req[source] = parsed; // Replace with sanitized/coerced data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Zod v3 uses .errors, Zod v4 uses .issues — handle both
        const issues = error.errors || error.issues || [];
        const errors = issues.map((e) => ({
          field: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
          message: e.message,
        }));
        return next(new ApiError(400, 'Validation failed', errors));
      }
      next(error);
    }
  };
};

module.exports = validate;
