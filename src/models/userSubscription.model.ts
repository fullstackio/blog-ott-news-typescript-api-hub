import mongoose, { Schema } from "mongoose";
import { IUserSubscription } from "../types/userSubscription.interface";

const UserSubscriptionSchema = new Schema<IUserSubscription>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  deviceInfo: { type: Object },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  setSystemServerInfo: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

UserSubscriptionSchema.methods.generatedAuthToken = function (): string {
  // Implement JWT or token generation logic here
  return "token";
};

const UserSubscription = mongoose.model<IUserSubscription>(
  "UserSubscription",
  UserSubscriptionSchema
);
export default UserSubscription;
