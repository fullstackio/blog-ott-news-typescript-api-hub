import mongoose, { Schema } from "mongoose";
import { IBlogTag } from "../types/blogSchema.interface";

const BlogTagSchema: Schema = new Schema<IBlogTag>(
  {
    name: {
      type: String,
      required: [true, "Tag name is required"],
      default: "",
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

export default mongoose.model<IBlogTag>(
  "BlogTag",
  BlogTagSchema
);
