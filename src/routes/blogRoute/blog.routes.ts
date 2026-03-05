import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/apiAccessibility/authenticate";
import { apiKeyAuth } from "../../middlewares/staticAuth/apiKeyAuthStatic";
import upload from "../../middlewares/uploads/upload";
import { uploadCategoryThumbnail } from "../../utils/multer/multer";

const express = require("express");
const router = express.Router();
const blogControllers = require("../../controllers/BlogControllers/blog.controllers");
const blogCategoryControllers = require("../../controllers/BlogControllers/blogCategory.controllers");
const blogTagControllers = require("../../controllers/BlogControllers/blogTags.controllers");

router
  .route("/add-blog")
  .post(
    authenticate,
    authorizeRoles("user", "admin"),
    upload.single("postThumbnail"),
    blogControllers.addBlog
  );

router
  .route("/all-blogs")
  .get(
    authenticate,
    authorizeRoles("user", "admin", "superadmin"),
    blogControllers.getAllBlogs
  );


router.route("/trash-blogs").get(authenticate,
    authorizeRoles("user", "admin", "superadmin"), blogControllers.getTrashBlog);
router.route("/blog/:id").get(authenticate,
    authorizeRoles("user", "admin", "superadmin"), blogControllers.singleBlog);
router
  .route("/blog/:id")
  .put(upload.single("postThumbnail"), blogControllers.editBlog);
router.route("/delete-soft-blog/:id").put(authenticate,
    authorizeRoles("user", "admin", "superadmin"), blogControllers.deleteBlogSoft);
router.route("/delete-hrd-blog/:id").delete(authenticate,
    authorizeRoles("user", "admin", "superadmin"), blogControllers.deleteBlogHard);
router.route("/delete-blog/:id").delete(authenticate,
    authorizeRoles("user", "admin", "superadmin"), blogControllers.deleteBlogDirect);

// draft blog
router.route("/draft-blog/:id").put(authenticate,
    authorizeRoles("user", "admin", "superadmin"), blogControllers.draftBlog);
router.route("/draft-blogs").get(authenticate,
    authorizeRoles("user", "admin", "superadmin"), blogControllers.getDraftBlog);
// Add blog category
router
  .route("/add-category")
  .post(
    uploadCategoryThumbnail.single("categoryThumbnail"),
    blogCategoryControllers.addBlogCategory
  );

router.route("/all-category").get(blogCategoryControllers.getAllBlogCategories);
router
  .route("/draft-blog-category")
  .get(blogCategoryControllers.getDraftBlogCate);
router
  .route("/category-details/:id")
  .get(blogCategoryControllers.singleBlogCategory);
router
  .route("/edit-category/:id")
  .post(blogCategoryControllers.editBlogCategory);
router
  .route("/delete-category-soft/:id")
  .post(blogCategoryControllers.deleteBlogCategorySoft);
router
  .route("/delete-category-hard/:id")
  .delete(blogCategoryControllers.deleteBlogCategoryHard);
router
  .route("/delete-category/:id")
  .delete(blogCategoryControllers.deleteBlogCategoryDirect);

  router.route("/add-tags").post(blogTagControllers.addBlogTag);
  router.route("/all-tags").get(blogTagControllers.getAllBlogTags);



// For frontend part only
  router
  .route("/blog-listing")
  .get(apiKeyAuth, blogControllers.getAllFrontEndBlogs);

export default router;
