import { z } from "zod";

export const subscriptionFormSchema = z.object({
  firstName: z
    .string()
    .min(3, { message: "First name is required" })
    .max(100, { message: "First name must be under 50 characters" })
    .regex(/^[A-Za-z\s]+$/, {
      message: "First name can only contain letters and spaces",
    }),

  lastName: z
    .string()
    .min(3, { message: "Last name is required" })
    .max(100, { message: "Last name must be under 50 characters" })
    .regex(/^[A-Za-z\s]+$/, {
      message: "Last name can only contain letters and spaces",
    }),

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
