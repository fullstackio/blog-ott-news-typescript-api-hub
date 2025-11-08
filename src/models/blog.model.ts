import mongoose, { Document, Schema, Model } from "mongoose";
import { IBlog } from "../types/blogSchema.interface";

const BlogSchema: Schema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },
    excerp: {
      type: String,
      required: false,
      trim: true,
    },
    postThumbnail: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },

    postCategory: [
      {
        type: mongoose.Schema.Types.ObjectId, // Allow both ObjectId and string
        ref: "BlogCategory", // this name is need to defined in Blog Category Schema
      },
    ],
    authInfo: {
      id: { type: String },
      firstName: { type: String },
      lastName: { type: String },
      email: { type: String },
      userId: { type: String },
      uniqueId: { type: String },
      role: {
        type: String,
        enum: ["superadmin", "admin", "user"],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
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
      enum: ["publish", "draft", "pending", "private", "trash", "inactive"],
      default: "publish",
    },

    slugInfo: {
      type: String,
      required: false,
    },
    timeZone: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Blog: Model<IBlog> = mongoose.model<IBlog>("Blog", BlogSchema);

export default Blog;
