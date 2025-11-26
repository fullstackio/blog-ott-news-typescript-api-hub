import { AccountType } from "../enums/authEnum/accountType";

export interface IAdmin extends Document {
  authTokenExpireTime?: number;
  refreshTokenExpireTime?: number;
  firstName: string;
  lastName: string;
  userGender?: string;
  email: string;
  userId?: string;
  uniqueId?: string;
  passWord: string;
  role: "superadmin" | "admin" | "user" | "buyer" | "seller" | "agent"; // you can extend this if needed
  phone?: string;
  countryCode?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  dob?: Date;
  age?: number;
  profileImage?: string;
  isActive: boolean;
  isDeleted: boolean;
  deviceInfo: object;
  paymentStatus: string;
  accountType: AccountType;
  otp?: number;
  otpExpires?: Date;
  refreshToken?: string;
  authToken?: string;
  resetToken?: string;
  resetTokenExpires?: string;
  setSystemServerInfo?: object;
  status: "pending" | "inactive" | "blocked" | "suspend" | "active";
  slugInfo: string;
  timeZone: string;
  lastLogin?: Date;
  lastLogout?: Date;
  createdAt: Date;
  updatedAt: Date;

  generatedAuthToken(): string;
}
