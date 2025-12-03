import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../cloudinary/cloudinary";

// Blog post thumbnail upload
const blogThumbnailStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blog_thumbnails",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 600, crop: "limit" }],
  } as any,
});

export const uploadBlogThumbnail = multer({ storage: blogThumbnailStorage });

// // Blog category thumbnail upload
const blogCategoryThumbnailStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blog_category_thumbnails", // separate folder
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 600, height: 400, crop: "limit" }],
  } as any,
});

export const uploadCategoryThumbnail = multer({
  storage: blogCategoryThumbnailStorage,
});
