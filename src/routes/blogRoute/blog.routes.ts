/**
 * @swagger
 * tags:
 *   name: Blog
 *   description: Blog management and categories
 */

/**
 * @swagger
 * /blog/add-blog:
 *   post:
 *     summary: Add a new blog
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               postThumbnail:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Blog created
 *       400:
 *         description: Validation error
 */
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

router
  .route("/add-blog")
  .post(
    authenticate,
    authorizeRoles("user", "admin"),
    upload.single("postThumbnail"),
    blogControllers.addBlog
  );

/**
 * @swagger
 * /blog/all-blogs:
 *   get:
 *     summary: Get all blogs (admin/user)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of blogs
 */
router
  .route("/all-blogs")
  .get(
    authenticate,
    authorizeRoles("user", "admin", "superadmin"),
    blogControllers.getAllBlogs
  );

/**
 * @swagger
 * /blog/blog-listing:
 *   get:
 *     summary: Get all blogs (frontend)
 *     tags: [Blog]
 *     responses:
 *       200:
 *         description: List of blogs for frontend
 */
// router
//   .route("/blog-listing")
//   .get(apiKeyAuth, blogControllers.getAllFrontEndBlogs);
router.route("/blog-listing").get(blogControllers.getAllFrontEndBlogs);
router.route("/draft-blogs").get(apiKeyAuth, blogControllers.getDraftUsers);
router.route("/blog/:id").get(blogControllers.singleBlog);
router
  .route("/blog/:id")
  .put(upload.single("postThumbnail"), blogControllers.editBlog);
router.route("/delete-soft-blog/:id").post(blogControllers.deleteBlogSoft);
router.route("/delete-hrd-blog/:id").delete(blogControllers.deleteBlogHard);
router.route("/delete-blog/:id").delete(blogControllers.deleteBlogDirect);
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
// //POST /api/add-category
// // Content-Type: multipart/form-data

export default router;
