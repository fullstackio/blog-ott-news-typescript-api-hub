import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, ZodObject } from "zod";

export const UserAddressValidate =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If schema expects { body, headers }, pass both
      let parsed;
      // Check if schema is a ZodObject and expects both body and headers
      if (
        schema instanceof ZodObject &&
        "body" in schema.shape &&
        "headers" in schema.shape
      ) {
        parsed = await schema.parseAsync({
          body: req.body,
          headers: req.headers,
        });
        req.body = parsed.body;
        req.headers = { ...req.headers, ...parsed.headers };
      } else {
        // Fallback for schemas expecting just body
        parsed = await schema.parseAsync(req.body);
        req.body = parsed;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Map to first error per field
        const seenFields = new Set();
        const filteredErrors = error.errors.filter((err) => {
          const field = err.path.join(".");
          if (seenFields.has(field)) return false;
          seenFields.add(field);
          return true;
        });

        return res.status(400).json({
          status: 400,
          success: false,
          message: "Validation failed",
          errors: filteredErrors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }

      return res.status(500).json({
        status: 500,
        success: false,
        message: "Internal server error",
      });
    }
  };
