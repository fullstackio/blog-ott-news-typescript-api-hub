import mongoose, { Schema } from "mongoose";
import { IBlogCategory } from "../types/blogSchema.interface";

const BlogCategorySchema: Schema = new Schema<IBlogCategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      default: "Unauthorized",
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    categoryThumbnail: {
      type: String, // Usually a URL or file path
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IBlogCategory>(
  "BlogCategory",
  BlogCategorySchema
);
