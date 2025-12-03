import mongoose, { Schema, Model } from "mongoose";
import { IUserLogin } from "../types/userLoginSchema.interface";

const UserLoginSchema: Schema = new Schema<IUserLogin>(
  {
    id: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    userGender: { type: String },
    email: { type: String, required: true },
    userId: { type: String },
    role: { type: String },
    lastLogin: { type: Date },
    lastLogout: { type: Date },
    status: { type: String, required: true },
    isActive: { type: Boolean, required: true },
    currentStatus: {
      type: String,
      enum: ["active", "hibernating", "logout", "background"],
      default: "active",
    },
    devices: {
      type: [String], // Array of device IDs or tokens
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const UserLogin: Model<IUserLogin> = mongoose.model<IUserLogin>(
  "UserLogin",
  UserLoginSchema
);
export default UserLogin;
