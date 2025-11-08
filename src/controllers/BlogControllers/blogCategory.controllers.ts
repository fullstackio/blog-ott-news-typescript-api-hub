import { Request, Response } from "express";
import BlogCategory from "../../models/blogCategory.model";
import slugify from "slugify";

export const addBlogCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const slug = slugify(name, { lower: true });

    const existing = await BlogCategory.findOne({ slug });
    if (existing) {
      return res.status(409).json({ error: "Category already exists" });
    }

    // ✅ Get uploaded image path from Cloudinary (Multer stores it in req.file)
    const categoryThumbnail = req.file?.path || "";

    const newCategory = await BlogCategory.create({
      name,
      slug,
      description,
      categoryThumbnail, // Set uploaded image URL
    });

    res.status(201).json({
      message: "Category created successfully",
      data: newCategory,
    });

    console.log(newCategory);
  } catch (error) {
    console.error("Add Blog Category Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAllBlogCategories = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const totalCategoryLength = await BlogCategory.countDocuments();

    const categories = await BlogCategory.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (!categories || categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No blog categories found",
        data: [],
        totalCategoryLength: 0,
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blog categories fetched successfully",
      data: categories,
      totalCategoryLength,
      pagination: {
        total: totalCategoryLength,
        page,
        limit,
        totalPages: Math.ceil(totalCategoryLength / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blog categories:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching blog categories",
      error: (error as Error).message,
    });
  }
};

export const singleBlogCategory = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const singlePostCategory = await BlogCategory.findById(id);

    if (!singlePostCategory) {
      return res
        .status(404)
        .json({ status: 404, success: false, message: "Post not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Post details fetched successfully",
      data: singlePostCategory,
    });
  } catch (error) {
    console.error("Single post error:", error);
    res
      .status(500)
      .json({ status: 500, success: false, message: "Internal Server Error" });
  }
};

export const editBlogCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Find category by ID
    const category = await BlogCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Update name and slug if name is changed
    if (name && name !== category.name) {
      category.name = name;
      category.slug = slugify(name, { lower: true });

      // Check if the new slug is already taken by another category
      const existing = await BlogCategory.findOne({
        slug: category.slug,
        _id: { $ne: id },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Another category with the same name already exists",
        });
      }
    }

    // Update description if provided
    if (description) {
      category.description = description;
    }

    // Update thumbnail if a new file is uploaded
    if (req.file?.path) {
      category.categoryThumbnail = req.file.path;
    }

    // Save changes
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Edit category error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const deleteBlogCategorySoft = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const deletedBlogCat = await BlogCategory.findByIdAndUpdate(
      id,
      { isDeleted: true, isActive: false },
      { new: true }
    );

    if (!deletedBlogCat) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Blog category not found",
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Blog category marked as deleted",
      data: deletedBlogCat,
    });
  } catch (error) {
    console.error("Blog category error:", error);
    res
      .status(500)
      .json({ status: 500, success: false, message: "Internal Server Error" });
  }
};

export const deleteBlogCategoryHard = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const deletedBlogCatHard = await BlogCategory.findById(id);

    if (!deletedBlogCatHard) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Blog category data not found",
      });
    }

    if (!deletedBlogCatHard.isDeleted) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Blog category cant delete directly",
      });
    }

    const deletedBlog = await BlogCategory.deleteOne({ _id: id });

    if (!deletedBlog) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Blog category data not found",
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Blog category deleted permanently",
      data: deletedBlog,
    });
  } catch (error) {
    console.error("Hard delete blog category error:", error);
    res
      .status(500)
      .json({ status: 500, success: false, message: "Internal Server Error" });
  }
};

export const deleteBlogCategoryDirect = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const deletedBlogCat = await BlogCategory.deleteOne({ _id: id });

    if (deletedBlogCat.deletedCount === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Blog category not found or already deleted",
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "You have permanently deleted this blog category",
    });
  } catch (error) {
    console.error("Hard delete blog category error:", error);
    res.status(500).json({
      status: 500,
      success: false,
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
};

export const getDraftBlogCate = async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default page 1
    const limit = parseInt(req.query.limit) || 10; // Default limit 10
    const skip = (page - 1) * limit;

    const totalDraftBlogsCat = await BlogCategory.countDocuments({
      isDeleted: true,
    });

    const draftBlog = await BlogCategory.find({ isDeleted: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalDraftBlogsCat / limit);

    if (!draftBlog.length) {
      return res.status(200).json({
        status: 200,
        success: false,
        message: "No draft blogs category found",
        data: [],
        totalBlogsLength: 0,
        pagination: {
          total: totalDraftBlogsCat,
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
      message: "Draft blogs category fetched successfully",
      data: {
        draftBlog,
      },
      totalBlogsLength: totalDraftBlogsCat,
      pagination: {
        total: totalDraftBlogsCat,
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
