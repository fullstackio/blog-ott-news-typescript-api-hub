import { z } from "zod";

// Validate OTP from body, and email, userId, id from headers
export const recheckOtpPasswordReset = z.object({
  body: z.object({
    otp: z.string().nonempty({ message: "OTP is required" }),
  }),
  headers: z.object({
    "x-user-email": z
      .string()
      .min(3, { message: "Email is required. Its missing in headers" })
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
    "x-user-id": z
      .string()
      .min(1, { message: "User ID is required. . Its missing in headers" }),
    "x-id": z
      .string()
      .min(1, { message: "ID is required. Its missing in headers" }),
  }),
});
