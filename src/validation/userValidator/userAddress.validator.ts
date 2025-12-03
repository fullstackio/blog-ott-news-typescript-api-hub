import { z } from "zod";

export const userAddressSchema = z.object({
  // _id is now obtained from auth middleware, not validated from body
  country: z.string().min(2, { message: "Country is required" }),
  state: z.string().min(2, { message: "State is required" }),
  city: z.string().min(2, { message: "City is required" }),
  zipCode: z.string().min(2, { message: "Zip code is required" }),
  address: z.string().min(5, { message: "Address is required" }),
  street: z.string().optional(),
  landMark: z.string().optional(),
});
