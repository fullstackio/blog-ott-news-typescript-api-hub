import { AccountType } from "../enums/authEnum/accountType";

export interface IAdmin extends Document {
  firstName: string;
  lastName: string;
  userGender?: string;
  email: string;
  userId?: string;
  uniqueId?: string;
  passWord: string;
  role: "superadmin" | "admin" | "user" | "buyer" | "seller" | "agent"; // you can extend this if needed
  phone?: string;
  isActive: boolean;
  isDeleted: boolean;
  deviceInfo: object;
  paymentStatus: boolean;
  accountType: AccountType;
  otp?: number;
  otpExpires?: string;
  refreshToken?: string;
  resetToken?: string;
  resetTokenExpires?: string;
  setSystemServerInfo?: object;
  status: "pending" | "approve" | "inactive" | "blocked" | "suspend";
  slugInfo: string;
  timeZone: string;
  lastLogin?: Date;
  lastLogout?: Date;
  createdAt: Date;
  updatedAt: Date;

  generatedAuthToken(): string;
}
