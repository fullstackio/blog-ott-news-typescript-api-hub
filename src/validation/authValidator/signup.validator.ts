import { z } from "zod";

export const registrationFormSchema = z
  .object({
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

    phone: z
      .string()
      .min(10, { message: "Phone number must be at least 10 digits" })
      .max(16, { message: "Phone number must be under 16 digits" })
      .regex(/^\+?[0-9]{10,15}$/, {
        message: "Phone number must be digits and may start with '+'",
      }),

    dob: z.preprocess(
      (arg) => (arg ? new Date(String(arg)) : undefined),
      z
        .date()
        .optional()
        .refine((d) => (d === undefined ? true : !isNaN(d.getTime())), {
          message: "Invalid date format for dob",
        })
        .refine((d) => (d === undefined ? true : d <= new Date()), {
          message: "DOB cannot be in the future",
        })
        .refine(
          (d) => {
            if (!d) return true;
            const minAge = 13;
            const cutoff = new Date();
            cutoff.setFullYear(cutoff.getFullYear() - minAge);
            return d <= cutoff;
          },
          { message: "User must be at least 13 years old" }
        )
    ),

    passWord: z
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

    userGender: z.preprocess(
      (arg) => (typeof arg === "string" ? arg.trim() : arg),
      z
        .string()
        .min(1, { message: "userGender is required" })
        .refine((val) => ["male", "female", "other"].includes(val), {
          message: "Invalid user gender",
        })
    ),

    accountAtmosphere: z
      .string()
      .min(1, { message: "Account atmosphere is required" })
      .refine(
        (val) =>
          [
            "company",
            "institute",
            "individual",
            "ngo",
            "school",
            "university",
            "other",
          ].includes(val),
        {
          message: "Invalid account atmosphere value",
        }
      ),

    accountAtmosphereName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.accountAtmosphere !== "individual") {
      if (
        !data.accountAtmosphereName ||
        data.accountAtmosphereName.trim().length === 0
      ) {
        ctx.addIssue({
          path: ["accountAtmosphereName"],
          code: z.ZodIssueCode.custom,
          message: "Account atmosphere name is required ",
        });
      }
    }
  });
