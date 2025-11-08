// utils/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// 🔵 Blog Thumbnail Storage (blogs/thumbnails)
export const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blogs/thumbnails", // ✅ Finalize your preferred folder
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 600, crop: "limit" }],
  },
});

// // 🟢 Blog Category Thumbnail Storage (blogs/category-thumbnails)
export const blogCategoryThumbnailStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blogs/category-thumbnails",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 600, height: 400, crop: "limit" }],
  },
});

export { cloudinary };
