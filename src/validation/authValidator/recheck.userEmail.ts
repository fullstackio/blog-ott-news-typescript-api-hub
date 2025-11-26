import { z } from "zod";

export const recheckEmailOtp = z.object({
  email: z
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
  userId: z.string().min(1, { message: "User ID is required" }),
});
