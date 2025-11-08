import { Document, Types } from "mongoose";
export interface IBlog extends Document {
  title: string;
  excerp?: string;
  content: string;
  postThumbnail?: string;
  postThumbnailUrl?: string;
  postBanner?: string;
  postCategory?: Types.ObjectId[]; // or (string | Types.ObjectId)[]
  tags?: string[];
  authInfo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userId: string;
    uniqueId: string;
    role: "superadmin" | "admin" | "user";
  };
  isActive: boolean;
  isDeleted: boolean;
  deviceInfo: object;
  setSystemServerInfo?: object;
  status: "publish" | "draft" | "pending" | "private" | "trash" | "inactive";
  slugInfo: string;
  timeZone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBlogCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  categoryThumbnail?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
