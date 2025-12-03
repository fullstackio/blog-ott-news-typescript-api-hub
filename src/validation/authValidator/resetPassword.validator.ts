import { z } from "zod";

// Validate newPassword from body, and email, userId, id from headers
export const resetPasswordValidation = z.object({
  body: z.object({
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(20, { message: "Password must be at most 20 characters" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^A-Za-z0-9]/, {
        message: "Password must contain at least one special character",
      })
      .refine((val) => !/\s/.test(val), {
        message: "Password must not contain spaces",
      }),
  }),
  headers: z.object({
    "x-user-email": z
      .string()
      .min(3, { message: "Email is required" })
      .email({ message: "Invalid email format" })
      .refine(
        (val) => {
          const domain = val.split("@")[1];
          return domain && domain.length >= 3 && domain.includes(".");
        },
        {
          message: "Invalid email domain",
        }
      ),
    "x-user-id": z.string().min(1, { message: "User ID is required" }),
    "x-id": z.string().min(1, { message: "ID is required" }),
  }),
});
