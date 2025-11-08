// middlewares/upload.ts
import multer from "multer";
import {
  storage,
  blogCategoryThumbnailStorage,
} from "../../utils/cloudinary/cloudinary";

const upload = multer({ storage });

export default upload;
