import { z } from "zod";

export const subscriptionFormSchema = z.object({
  email: z
    .string()
    .min(3, { message: "Email is required" })
    .max(100, { message: "Email must be under 100 characters" })
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
      message: "Invalid email format",
    })
    .refine(
      (val) => {
        const domain = val.split("@")[1];
        return domain && domain.length >= 3 && domain.includes(".");
      },
      {
        message: "Invalid email domain",
      }
    ),
});
