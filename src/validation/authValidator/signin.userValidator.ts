import { z } from "zod";

export const userOtpValidation = z.object({
  otp: z.string().min(1, { message: "OTP is required" }),
});
