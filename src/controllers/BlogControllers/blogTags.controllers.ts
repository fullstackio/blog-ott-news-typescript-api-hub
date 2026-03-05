import { Request, Response } from "express";
import BlogTagSchema from "../../models/blogTags.model";
import slugify from "slugify";


export const addBlogTag = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Tag name is required" });
    }

    const slug = slugify(name, { lower: true });

    const existing = await BlogTagSchema.findOne({ slug });
    if (existing) {
      return res.status(409).json({ error: "Tag already exists" });
    }

    

    const newTag = await BlogTagSchema.create({
      name,
      slug
    });

    res.status(201).json({
      message: "Tag created successfully",
      data: newTag,
    });

    console.log(newTag);
  } catch (error) {
    console.error("Add Blog Tag Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAllBlogTags = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const totalTagLength = await BlogTagSchema.countDocuments();

    const tags = await BlogTagSchema.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (!tags || tags.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No blog tags found",
        data: [],
        totalTagLength: 0,
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
      message: "Blog tags fetched successfully",
      data: tags,
      totalTagLength,
      pagination: {
        total: totalTagLength,
        page,
        limit,
        totalPages: Math.ceil(totalTagLength / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blog tags:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching blog tags",
      error: (error as Error).message,
    });
  }
};