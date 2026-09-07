"use strict";

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error?.issues?.[0];
      return res.status(400).json({
        success: false,
        error: "INVALID_REQUEST",
        message: issue?.message || "Please check the submitted information."
      });
    }

    req.body = result.data;
    return next();
  };
}

module.exports = { validate };
