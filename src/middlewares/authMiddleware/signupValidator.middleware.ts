import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const SingnUPValidate =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseBody = await schema.parseAsync(req.body);
      req.body = parseBody;
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
