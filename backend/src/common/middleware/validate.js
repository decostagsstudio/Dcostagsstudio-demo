export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = parsed.error.flatten();
      return next(error);
    }

    req[source] = parsed.data;
    return next();
  };
}
