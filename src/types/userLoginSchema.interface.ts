import { Document, Types } from "mongoose";
export interface IUserLogin extends Document {
  id: string;
  firstName: string;
  lastName: string;
  userGender?: string;
  email: string;
  userId?: string;
  role?: string; // you can extend this if needed
  lastLogin?: Date;
  lastLogout?: Date;
  status: string;
  isActive: boolean;
  currentStatus?: "active" | "hibernating" | "logout" | "background";
  devices?: string[];
  createdAt: Date;
  updatedAt: Date;
}
