import mongoose, { Document, Schema, Model } from "mongoose";
import { IAdmin } from "../types/adminSchema.interface";
const JWT = require("jsonwebtoken");

const AdminSchema: Schema = new Schema<IAdmin>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    userGender: {
      type: String,
      enum: ["male", "female", "other"],
      required: false,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passWord: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    userId: {
      type: String,
      unique: true,
      trim: true,
      required: true,
    },
    uniqueId: {
      type: String,
      unique: true,
      trim: true,
      required: true,
    },
    role: {
      type: String,
      enum: ["superadmin", "admin", "user"],
      default: "user",
    },
    phone: {
      type: Number,
      trim: true,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deviceInfo: {
      type: Object,
      required: false,
    },
    setSystemServerInfo: {
      type: Object,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "approve", "inactive", "blocked", "suspend"],
      default: "pending",
    },
    accountType: {
      type: String as any,
      enum: ["premium", "free", "basic", "business"],
      default: "free",
    },
    paymentStatus: {
      type: Boolean,
      default: false,
    },
    slugInfo: {
      type: String,
      required: false,
    },
    timeZone: {
      type: String,
      required: false,
    },
    otp: {
      type: Number,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    lastLogout: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
// Authtoken
AdminSchema.methods.generatedAuthToken = async function () {
  try {
    if (!process.env.JWT_SECREATE_TOKEN) {
      throw new Error("JWT_SECREATE_TOKEN is not set in environment variables");
    }
    const payload = {
      id: this._id.toString(),
      setFirstName: this.firstName,
      setLastName: this.lastName,
      setEmail: this.email,
      setUserId: this.userId,
      setUserUniqueId: this.uniqueId,
      setRole: this.role,
      setStatus: this.status,
      setAccountStatus: this.isActive,
    };

    const header = {
      alg: process.env.HMA_ALG_HS256,
      typ: "JWT",
      // customHeaderKey: 'CUSTOMBLOGOTT'
    };

    // const expiresAccessAt = Date.now() + 5 * 60 * 60 * 1000; // 5 minutes in ms
    const expiresAccessAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    const expiresRefreshAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 day in ms

    const accessToken = JWT.sign(payload, process.env.JWT_SECREATE_TOKEN, {
      expiresIn: "7d",
      header,
    });

    const refreshToken = JWT.sign(payload, process.env.JWT_REFRESH_TOKEN, {
      expiresIn: "7d",
      header,
    });

    return {
      accessToken,
      expiresAccessAt,
      refreshToken,
      expiresRefreshAt,
    };
  } catch (error) {
    console.log(error);
  }
};
// Optional: Before saving, hash password logic can be added
// AdminSchema.pre('save', async function(next) { ... });

const Admin: Model<IAdmin> = mongoose.model<IAdmin>("Admin", AdminSchema);

export default Admin;
