import { Request, Response } from "express";
import Blog from "../../models/blog.model";
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

    // console.log("Get User Id decoded details: ", decoded);
    // const decodedId = decoded.id;
    // const decodedUserFName = decoded.setFirstName;
    // const decodedUserLName = decoded.setLastName;
    // const decodedUserEmail = decoded.setEmail;
    // const decodedUserId = decoded.setUserId;
    // const decodedUserRole = decoded.setRole;
    const authorInfo = {
      id: decoded.id,
      firstName: decoded.setFirstName,
      lastName: decoded.setLastName,
      email: decoded.setemail, // not setEmail
      userId: decoded.setUserId,
      uniqueId: decoded.setUserUniqueId,
      role: decoded.setRole,
    };

    // get author details from Authtoken End

    const {
      title,
      excerp,
      content,
      postBanner,
      postCategory,
      tags,
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
    const postThumbnailUrl = (req.file as any)?.path || null;

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

    // ✅ Create the blog entry
    const newBlog = await Blog.create({
      title,
      excerp,
      content,
      postThumbnail: postThumbnailUrl,
      postBanner,
      postCategory: finalPostCategory, // This will use default if undefined
      tags,
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
    const authorInfo = {
      id: decoded.id,
      role: decoded.setRole,
    };
    console.log("Get login details", authorInfo);
    const { status, postCategory } = req.query;
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;

    page = page < 1 ? 1 : page;
    limit = limit < 1 ? 10 : limit;

    // Base filter
    const filter: any = { isDeleted: false };

    // Filter only this user's blogs if role === 'user'
    if (authorInfo.role === "user") {
      filter["authInfo.id"] = authorInfo.id; // Match blog's embedded `authInfo.id` to token `id`
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
    const filter: any = { isDeleted: false };
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
    const { id } = req.params;

    const singlePost = await Blog.findById(id);

    if (!singlePost) {
      return res
        .status(404)
        .json({ status: 404, success: false, message: "Post not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Post details fetched successfully",
      data: singlePost,
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
    const { id } = req.params;

    const deletedBlog = await Blog.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!deletedBlog) {
      return res
        .status(404)
        .json({ status: 404, success: false, message: "User not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "User marked as deleted",
      data: deletedBlog,
    });
  } catch (error) {
    console.error("Delete user error:", error);
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
    const { id } = req.params;

    const deletedBlog = await Blog.deleteOne({ _id: id });

    if (!deletedBlog) {
      return res
        .status(404)
        .json({ status: 404, success: false, message: "User not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Your are deleted this user directly & ermanently",
      data: deletedBlog,
    });
  } catch (error) {
    console.error("Hard delete user error:", error);
    res
      .status(500)
      .json({ status: 500, success: false, message: "Internal Server Error" });
  }
};

export const getDraftUsers = async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default page 1
    const limit = parseInt(req.query.limit) || 10; // Default limit 10
    const skip = (page - 1) * limit;

    const totalDraftBlogs = await Blog.countDocuments({ isDeleted: true });

    const draftBlog = await Blog.find({ isDeleted: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalDraftBlogs / limit);

    if (!draftBlog.length) {
      return res.status(200).json({
        status: 200,
        success: false,
        message: "No draft blogs found",
        data: [],
        totalBlogsLength: 0,
        pagination: {
          total: totalDraftBlogs,
          page,
          limit,
          pages: totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Draft blogs fetched successfully",
      data: {
        draftBlog,
      },
      totalBlogsLength: totalDraftBlogs,
      pagination: {
        total: totalDraftBlogs,
        page,
        limit,
        pages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get blogs error:", error);
    res.status(500).json({
      status: 500,
      success: false,
      message: "Internal Server Error from blog Controller",
    });
  }
};
