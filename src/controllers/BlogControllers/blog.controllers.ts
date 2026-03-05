import { Request, Response } from "express";
import Blog from "../../models/blog.model";
import BlogTag from "../../models/blogTags.model";
import BlogCategory from "../../models/blogCategory.model";
import os from "os";
import { getDeviceInfo } from "../../utils/helper/deviceInfo.helper";
import { generateBlogSlug } from "../../utils/helper/blog.helper";
const jwt = require("jsonwebtoken");

// Reusable enum sanitizer
function sanitizeEnum<T extends string>(
  value: any,
  validOptions: T[],
  fallback?: T
): T | undefined {
  if (validOptions.includes(value)) return value;
  return fallback ?? undefined;
}

export const addBlog = async (req: Request, res: Response) => {
  try {
    // get author details from Authtoken
    const token = req.headers["authorization"]?.split(" ")[1]; // Authorization header format: "Bearer <token>"

    console.log("Get authtoken", token);
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECREATE_TOKEN); // Replace with your JWT secret key


    const authorInfo = {
      id: decoded.id,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      userId: decoded.userId,
      uniqueId: decoded.uniqueId,
      role: decoded.role,
    };

    // get author details from Authtoken End


    const {
      title,
      excerp,
      content,
      postBanner,
      postCategory,
      tags: inputTags,
      authInfo,
      status,
      slugInfo,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Title and Content are required.",
      });
    }

    // ✅ Handle optional image from multer/cloudinary
    console.log("[addBlog] req.file:", req.file);
    
    let postThumbnail = null;
    if (req.file) {
      try {
        // Try to use Cloudinary URL
        const file: any = req.file;
        postThumbnail = file.secure_url || file.url || null;
        if (!postThumbnail) throw new Error("Cloudinary URL missing");
      } catch (cloudErr) {
        // Fallback: Save file locally if Cloudinary fails
        try {
          const fs = require("fs");
          const path = require("path");
          const uploadsDir = path.join(__dirname, "../../../uploads/blog/thumbnail");
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          // req.file.buffer may not be available if multer-storage-cloudinary fails, so fallback to req.file.path
          let localFilePath = null;
          if (req.file.buffer) {
            // If buffer is available (memory storage)
            const ext = path.extname(req.file.originalname) || ".jpg";
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
            localFilePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(localFilePath, req.file.buffer);
          } else if (req.file.path) {
            // If file is already saved by multer (disk storage)
            const ext = path.extname(req.file.originalname) || ".jpg";
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
            localFilePath = path.join(uploadsDir, fileName);
            fs.copyFileSync(req.file.path, localFilePath);
          }
          if (localFilePath) {
            // Save relative path for serving via static route
            postThumbnail = `/uploads/blog/thumbnail/${path.basename(localFilePath)}`;
          } else {
            postThumbnail = null;
          }
          console.error("[addBlog] Cloudinary upload failed, saved locally:", postThumbnail);
        } catch (localErr) {
          console.error("[addBlog] Local file save failed:", localErr);
          postThumbnail = null;
        }
      }
    }

    const deviceInfo = getDeviceInfo(req);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // ✅ Handle slug generation
    const baseSlug = slugInfo || generateBlogSlug(title);
    const regex = new RegExp(`^${baseSlug}(-\\d+)?$`, "i");
    const existingSlugs = await Blog.find({ slugInfo: regex }).select(
      "slugInfo"
    );

    let finalSlug = baseSlug;
    if (existingSlugs.length > 0) {
      const suffixes = existingSlugs.map((b) => {
        const match = b.slugInfo.match(new RegExp(`^${baseSlug}-(\\d+)$`));
        return match ? parseInt(match[1], 10) : 0;
      });
      const nextSuffix = Math.max(...suffixes) + 1;
      finalSlug = `${baseSlug}-${nextSuffix}`;
    }

    // ✅ Sanitize enums
    let finalPostCategory: string[] = [];

    // Handle multiple postCategory from formData (string or array)
    if (
      !postCategory ||
      (Array.isArray(postCategory) && postCategory.length === 0)
    ) {
      const defaultCategory = await BlogCategory.findOne({
        slug: "unauthorized",
      });
      if (defaultCategory) {
        finalPostCategory = [String(defaultCategory._id)];
      } else {
        console.warn("Default 'unauthorized' category not found.");
        finalPostCategory = [];
      }
    } else if (Array.isArray(postCategory)) {
      finalPostCategory = postCategory;
    } else if (typeof postCategory === "string") {
      // If comma separated, split into array
      if (postCategory.includes(",")) {
        finalPostCategory = postCategory
          .split(",")
          .map((cat: string) => cat.trim());
      } else {
        finalPostCategory = [postCategory];
      }
    }

    const cleanedStatus = sanitizeEnum(status, [
      "publish",
      "draft",
      "pending",
      "private",
      "trash",
      "inactive",
    ]);

    // ✅ Server Info
    const systemServerInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      architecture: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
    };


    // ✅ Handle tags: support array or comma-separated string, trim, store original (with #) as name, remove # only for slug
    let tagIds: string[] = [];
    let tagsToProcess: string[] = [];
    if (inputTags) {
      if (Array.isArray(inputTags)) {
        tagsToProcess = inputTags;
      } else if (typeof inputTags === "string") {
        tagsToProcess = inputTags.split(",").map((t: string) => t.trim());
      }
      // Clean up tags: remove empty, trim
      tagsToProcess = tagsToProcess
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      for (const tagName of tagsToProcess) {
        const slug = require("slugify")(tagName.replace(/^#/, ""), { lower: true });
        let tagDoc = await BlogTag.findOne({ slug });
        if (!tagDoc) {
          try {
            tagDoc = await BlogTag.create({ name: tagName, slug });
          } catch (err: any) {
            // Duplicate error or other error
            if (err.code === 11000) {
              return res.status(409).json({
                status: 409,
                success: false,
                message: `Tag '${tagName}' already exists.`,
              });
            } else {
              return res.status(500).json({
                status: 500,
                success: false,
                message: `Failed to create tag '${tagName}': ${err.message}`,
              });
            }
          }
        }
        tagIds.push(tagDoc._id.toString());
      }
    }

    const newBlog = await Blog.create({
      title,
      excerp,
      content,
      postThumbnail,
      postBanner,
      postCategory: finalPostCategory, // This will use default if undefined
      tags: tagIds,
      authInfo: authorInfo,
      isActive: true,
      isDeleted: false,
      deviceInfo,
      setSystemServerInfo: systemServerInfo,
      status: cleanedStatus,
      slugInfo: finalSlug,
      timeZone,
    });

    return res.status(201).json({
      status: 201,
      success: true,
      message: "Blog created successfully",
      data: newBlog,
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal Server Error",
    });
  }
};

// const formData = new FormData();
// formData.append("title", "Test Blog");
// formData.append("content", "Blog content");
// formData.append("postThumbnail", file); // actual File object

// await axios.post("/api/add-blog", formData, {
//   headers: { "Content-Type": "multipart/form-data" },
// });

// /api/blogs?page=${page}&limit=${limit}`

export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    // Get token from headers
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    // Decode token
    const decoded: any = jwt.verify(token, process.env.JWT_SECREATE_TOKEN!);
    // Support both role and setRole
    const role = decoded.setRole || decoded.role;
    const authorInfo = {
      id: decoded.id,
      role,
    };
    console.log("Get login details", authorInfo);
    const { status, postCategory } = req.query;
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;

    page = page < 1 ? 1 : page;
    limit = limit < 1 ? 10 : limit;

    // Base filter
    const filter: any = { isDeleted: false, isActive: true };

    // Only admin and superadmin can see all posts
    if (role !== "admin" && role !== "superadmin") {
      filter["authInfo.id"] = authorInfo.id;
    }

    // Optional filters
    if (status) filter.status = status;
    if (postCategory) filter.postCategory = postCategory;

    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate("postCategory", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Blog.countDocuments(filter),
    ]);

    // If no blogs found
    if (total === 0 || blogs.length === 0) {
      return res.status(200).json({
        status: 200,
        success: false,
        message: "No blogs found.",
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        totalBlogsLength: 0,
      });
    }

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Blogs fetched successfully",
      data: blogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
      totalBlogsLength: blogs.length,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal Server Error",
    });
  }
};


export const getAllFrontEndBlogs = async (req: Request, res: Response) => {
  try {
    const { status, postCategory } = req.query;

    // Filter setup
    const filter: any = { isDeleted: false, isActive: true };
    if (status && status !== "all") filter.status = status;
    if (postCategory && postCategory !== "all")
      filter.postCategory = postCategory;

    // Total blogs matching filter
    const totalCount = await Blog.countDocuments(filter);

    // Pagination logic
    const hasPage = req.query.page !== undefined;
    const hasLimit = req.query.limit !== undefined;

    let page = hasPage ? parseInt(req.query.page as string) || 1 : 1;
    let limit = hasLimit
      ? parseInt(req.query.limit as string) || 9
      : totalCount;

    page = page < 1 ? 1 : page;
    limit = limit < 1 ? totalCount : limit;

    const skip = (page - 1) * limit;

    // Get paginated blogs
    const blogs = await Blog.find(filter)
      .populate("postCategory", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Blogs fetched successfully",
      data: { blogs },
      pagination: {
        total: totalCount, // total from DB
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
      totalBlogsLength: blogs.length, // ✅ how many are shown now
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const singleBlog = async (req: any, res: any) => {
  try {
    // Extract token from Authorization header
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    // Decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECREATE_TOKEN);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Get user info, support both setRole and role in JWT
    const decodedUserRole = decoded.setRole || decoded.role;
    const userInfo = {
      id: decoded.id,
      role: decodedUserRole,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      userId: decoded.userId,
      uniqueId: decoded.uniqueId,
    };
    console.log("Get login details", userInfo);

    const { id } = req.params;
    console.log("[singleBlog] Requested blog ID:", id);
    const singlePost = await Blog.findById(id)
      .populate("postCategory", "name slug")
      .populate({
        path: "tags",
        model: "BlogTag",
        select: "name slug"
      });
    console.log("[singleBlog] Blog document found:", singlePost);

    if (!singlePost) {
      console.warn(`[singleBlog] Blog not found for ID: ${id}`);
      return res
        .status(404)
        .json({ status: 404, success: false, message: "Post not found" });
    }

    // Authorization logic
    const userRoleToCheck = userInfo.role;
    // Only admin or superadmin can view any post
    if (userRoleToCheck === "admin" || userRoleToCheck === "superadmin") {
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Post details fetched successfully",
        data: singlePost,
        user: userInfo,
      });
    }

    // For users, only allow if the post belongs to them
    if (userRoleToCheck === "user" && singlePost.authInfo && singlePost.authInfo.id && String(singlePost.authInfo.id) === String(userInfo.id)) {
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Post details fetched successfully",
        data: singlePost,
        user: userInfo,
      });
    }

    // Otherwise, not authorized
    return res.status(403).json({
      status: 403,
      success: false,
      message: "You are not authorised to view this post.",
    });
  } catch (error) {
    console.error("Single post error:", error);
    res
      .status(500)
      .json({ status: 500, success: false, message: "Internal Server Error" });
  }
};

export const editBlog = async (req: any, res: any) => {
  try {
     // Extract token from Authorization header
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    // Decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECREATE_TOKEN);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Get user info, support both setRole and role in JWT
    const decodedUserRole = decoded.setRole || decoded.role;
    const userInfo = {
      id: decoded.id,
      role: decodedUserRole,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      userId: decoded.userId,
      uniqueId: decoded.uniqueId,
    };
    console.log("Get login details", userInfo);

    
    const { id } = req.params;
    const updateData = req.body || {};

    // Handle multiple postCategory from formData (string or array)
    if (updateData.postCategory) {
      if (Array.isArray(updateData.postCategory)) {
        // Already an array
      } else if (typeof updateData.postCategory === "string") {
        if (updateData.postCategory.includes(",")) {
          updateData.postCategory = updateData.postCategory
            .split(",")
            .map((cat: string) => cat.trim());
        } else {
          updateData.postCategory = [updateData.postCategory];
        }
      }
    }

    // Check if blog exists
    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Blog not found",
      });
    }

    // If title is updated, regenerate slug (with suffix if needed)
    if (updateData.title && updateData.title !== existingBlog.title) {
      const baseSlug = generateBlogSlug(updateData.title);
      const regex = new RegExp(`^${baseSlug}(-\\d+)?$`, "i");

      const existingSlugs = await Blog.find({
        slugInfo: regex,
        _id: { $ne: id },
      }).select("slugInfo");

      let finalSlug = baseSlug;
      if (existingSlugs.length > 0) {
        const suffixes = existingSlugs.map((b) => {
          const match = b.slugInfo.match(new RegExp(`^${baseSlug}-(\\d+)$`));
          return match ? parseInt(match[1], 10) : 0;
        });

        const nextSuffix = Math.max(...suffixes) + 1;
        finalSlug = `${baseSlug}-${nextSuffix}`;
      }

      updateData.slugInfo = finalSlug;
    }

    // Update the blog
    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(200).json({
      status: 200,
      success: true,
      message: "Blog has been updated successfully",
      data: updatedBlog,
    });
  } catch (error) {
    console.error("Edit blog data error:", error);
    res.status(500).json({
      status: 500,
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const deleteBlogSoft = async (req: any, res: any) => {
  try {

     // Extract token from Authorization header
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    // Decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECREATE_TOKEN);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Get user info, support both setRole and role in JWT
    const decodedUserRole = decoded.setRole || decoded.role;
    const userInfo = {
      id: decoded.id,
      role: decodedUserRole,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      userId: decoded.userId,
      uniqueId: decoded.uniqueId,
    };
    console.log("Get login details", userInfo);

    const { id } = req.params;

    // Check if blog exists
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ status: 404, success: false, message: "Blog data not found" });
    }

    // Only admin/superadmin or owner (id match) can soft delete
    const isAdmin = userInfo.role === "admin" || userInfo.role === "superadmin";
    const isOwner = blog.authInfo && blog.authInfo.id && String(blog.authInfo.id) === String(userInfo.id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "You are not authorised to delete this blog.",
      });
    }

    // If already deleted
    if (blog.isDeleted === true && blog.isActive === false) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Post already deleted",
      });
    }

    const deletedBlog = await Blog.findByIdAndUpdate(
      id,
      { isDeleted: true, isActive: false, status: "trash" },
      { new: true }
    );

    if (!deletedBlog) {
      return res.status(404).json({ status: 404, success: false, message: "Blog data not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Blog marked as deleted",
      data: deletedBlog,
    });
  } catch (error) {
    console.error("Delete blog error:", error);
    res
      .status(500)
      .json({ status: 500, success: false, message: "Internal Server Error" });
  }
};

export const deleteBlogHard = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res
        .status(404)
        .json({ status: 404, success: false, message: "Blog data not found" });
    }

    if (!blog.isDeleted) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Blog must be soft-deleted before hard delete",
      });
    }

    const deletedBlog = await Blog.deleteOne({ _id: id });

    if (!deletedBlog) {
      return res
        .status(404)
        .json({ status: 404, success: false, message: "Blog data not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Blog deleted permanently",
      data: deletedBlog,
    });
  } catch (error) {
    console.error("Hard delete blog error:", error);
    res
      .status(500)
      .json({ status: 500, success: false, message: "Internal Server Error" });
  }
};

export const deleteBlogDirect = async (req: any, res: any) => {
  try {

    // Extract token from Authorization header
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    // Decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECREATE_TOKEN);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Get user info, support both setRole and role in JWT
    const decodedUserRole = decoded.setRole || decoded.role;
    const userInfo = {
      id: decoded.id,
      role: decodedUserRole,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      userId: decoded.userId,
      uniqueId: decoded.uniqueId,
    };
    console.log("Get login details", userInfo);


    const { id } = req.params;

    // Check if blog exists
    const blog = await Blog.findById(id);
    if (!blog) {
      return res
        .status(404)
        .json({ status: 404, success: false, message: "Blog not found" });
    }

   


    // Only admin/superadmin or owner (id match) can delete
    const isAdmin = userInfo.role === "admin" || userInfo.role === "superadmin";
    const isOwner = blog.authInfo && blog.authInfo.id && String(blog.authInfo.id) === String(userInfo.id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "You are not authorised to delete this blog.",
      });
    }

    const deletedBlog = await Blog.deleteOne({ _id: id });

    if (!deletedBlog || deletedBlog.deletedCount === 0) {
      return res
        .status(404)
        .json({ status: 404, success: false, message: "Blog not found or already deleted" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Blog deleted directly and permanently.",
      data: deletedBlog,
    });
  } catch (error) {
    console.error("Hard delete blog error:", error);
    res
      .status(500)
      .json({ status: 500, success: false, message: "Internal Server Error" });
  }
};

export const getTrashBlog = async (req: any, res: any) => {
  try {
    // Extract token from Authorization header
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    // Decode token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECREATE_TOKEN);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Support both setRole and role in JWT
    const role = decoded.setRole || decoded.role;
    const userId = decoded.id;

    // Filter for trashed blogs
    const filter: any = { isActive: false, isDeleted: true, status: "trash" };

    // Only admin/superadmin can see all trashed blogs, others see their own
    if (role !== "admin" && role !== "superadmin") {
      filter["authInfo.id"] = userId;
    }

    // Pagination
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;
    page = page < 1 ? 1 : page;
    limit = limit < 1 ? 10 : limit;
    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate("postCategory", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Blog.countDocuments(filter),
    ]);

    if (!blogs || blogs.length === 0) {
      return res.status(200).json({
        status: 200,
        success: false,
        message: "No trash post found",
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        totalBlogsLength: 0,
      });
    }
    return res.status(200).json({
      status: 200,
      success: true,
      message: "Trashed blogs fetched successfully",
      data: blogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
      totalBlogsLength: blogs.length,
    });
  } catch (error) {
    console.error("Error fetching trashed blogs:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const draftBlog = async (req: any, res: any) => {
  try {

     // Extract token from Authorization header
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    // Decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECREATE_TOKEN);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Get user info, support both setRole and role in JWT
    const decodedUserRole = decoded.setRole || decoded.role;
    const userInfo = {
      id: decoded.id,
      role: decodedUserRole,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      userId: decoded.userId,
      uniqueId: decoded.uniqueId,
    };
    console.log("Get login details", userInfo);

    const { id } = req.params;

    // Check if blog exists
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ status: 404, success: false, message: "Blog data not found" });
    }

    // Only admin/superadmin or owner (id match) can soft delete
    const isAdmin = userInfo.role === "admin" || userInfo.role === "superadmin";
    const isOwner = blog.authInfo && blog.authInfo.id && String(blog.authInfo.id) === String(userInfo.id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "You are not authorised to delete this blog.",
      });
    }

    // If already deleted
    if (blog.isDeleted === false && blog.isActive === false && blog.status === "draft") {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Post already drafted",
      });
    }

    const deletedBlog = await Blog.findByIdAndUpdate(
      id,
      { isDeleted: false, isActive: false, status: "draft" },
      { new: true }
    );

    if (!deletedBlog) {
      return res.status(404).json({ status: 404, success: false, message: "Blog data not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Blog marked as drafted",
      data: deletedBlog,
    });
  } catch (error) {
    console.error("Draft blog error:", error);
    res
      .status(500)
      .json({ status: 500, success: false, message: "Internal Server Error" });
  }
};


export const getDraftBlog = async (req: any, res: any) => {
  try {
    // Extract token from Authorization header
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    // Decode token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECREATE_TOKEN);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Support both setRole and role in JWT
    const role = decoded.setRole || decoded.role;
    const userId = decoded.id;

    // Filter for drafted blogs
    const filter: any = { isActive: false, isDeleted: false, status: "draft" };

    // Only admin/superadmin can see all drafted blogs, others see their own
    if (role !== "admin" && role !== "superadmin") {
      filter["authInfo.id"] = userId;
    }

    // Pagination
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;
    page = page < 1 ? 1 : page;
    limit = limit < 1 ? 10 : limit;
    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate("postCategory", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Blog.countDocuments(filter),
    ]);

    if (!blogs || blogs.length === 0) {
      return res.status(200).json({
        status: 200,
        success: false,
        message: "No drafted post found",
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        totalBlogsLength: 0,
      });
    }
    return res.status(200).json({
      status: 200,
      success: true,
      message: "Drafted blogs fetched successfully",
      data: blogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
      totalBlogsLength: blogs.length,
    });
  } catch (error) {
    console.error("Error fetching drafted blogs:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal Server Error",
    });
  }
};



