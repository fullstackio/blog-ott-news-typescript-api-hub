import mongoose, { Schema, Document, Model } from "mongoose";

import { IAddress } from "../types/addressSchema.interface";

const UserAddressSchema: Schema = new Schema<IAddress>(
  {
    _id: { type: String, required: true, index: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true },
    address: { type: String, required: true },
    street: { type: String },
    landMark: { type: String },
  },
  { timestamps: true }
);

const UserAddress: Model<IAddress> = mongoose.model<IAddress>(
  "UserAddress",
  UserAddressSchema
);
export default UserAddress;
