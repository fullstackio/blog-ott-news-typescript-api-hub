import { AccountType } from "../enums/authEnum/accountType";

export interface IAdmin extends Document {
  currentStatus?: string;
  authTokenExpireTime?: Date;
  refreshTokenExpireTime?: Date;
  firstName: string;
  lastName: string;
  userGender?: string;
  email: string;
  userId?: string;
  uniqueId?: string;
  passWord: string;
  role: "superadmin" | "admin" | "user" | "buyer" | "seller" | "agent"; // you can extend this if needed
  phone?: string;
  addressInfo?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  dob?: Date;
  age?: number;
  isLoginAllowed?: boolean;
  isLoggedInActive?: boolean;
  currentAge?: number;
  profileImage?: string;
  isActive: boolean;
  isDeleted: boolean;
  deviceInfo: object;
  devices?: string[];
  paymentStatus: string;
  accountType?: AccountType | string;
  accountAtmosphere:
    | "company"
    | "institute"
    | "individual"
    | "ngo"
    | "school"
    | "university"
    | "other";
  accountAtmosphereName?: string;
  otp?: number;
  otpExpires?: Date;
  userDataCompletionStatus?: string;
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
