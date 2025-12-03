import { Request, Response } from "express";
import UserAddress from "../../models/userAddress.model";

export const addUserAddress = async (req: Request, res: Response) => {
  try {
    // userId is obtained from the authenticated user (authToken), not from the request body
    const userId = (req as any).user?.id;
    const { country, state, city, zipCode, address, street, landMark } =
      req.body;
    if (!userId || !country || !state || !city || !zipCode || !address) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Missing required address fields",
      });
    }

    // Check if user exists and is active
    const Admin = require("../../models/admin.model").default;
    const user = await Admin.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "User not found",
      });
    }
    if (!user.isActive) {
      return res.status(403).json({
        status: 403,
        success: false,
        message:
          "User is not active. Please contact support if you believe this is an error.",
      });
    }
    if (!user.isLoggedInActive) {
      return res.status(401).json({
        status: 401,
        success: false,
        message:
          "Your session is inactive. Please log in to your account to continue adding addresses. If you have trouble logging in, please contact support for assistance.",
      });
    }

    const userAddress = await UserAddress.create({
      userId,
      country,
      state,
      city,
      zipCode,
      address,
      street,
      landMark,
    });

    // Optionally, you can push the address to an array in Admin collection
    try {
      await Admin.findByIdAndUpdate(
        userId,
        {
          $push: {
            addressInfo: {
              userId,
              country,
              state,
              city,
              zipCode,
              address,
              street,
              landMark,
            },
          },
        },
        { new: true }
      );
      console.log(`Admin addressInfo updated for userId: ${userId}`);
    } catch (adminError) {
      console.error("Failed to update Admin addressInfo:", adminError);
    }

    const response = {
      status: 201,
      success: true,
      message: "Address added successfully",
      data: userAddress,
    };
    console.log("User address added successfully:", response);
    res.status(201).json(response);
  } catch (error) {
    let errorMessage = "Internal Server Error";
    if (typeof error === "object" && error !== null && "message" in error) {
      errorMessage = (error as any).message;
    }
    const errorResponse = {
      status: 500,
      success: false,
      message: errorMessage,
      error,
    };
    console.error("Add user address error:", errorResponse);
    res.status(500).json(errorResponse);
  }
};

export const getUserAddresses = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "User ID is required",
      });
    }
    const addresses = await UserAddress.find({ userId });
    res.status(200).json({
      status: 200,
      success: true,
      message: "Addresses fetched successfully",
      data: addresses,
    });
  } catch (error) {
    let errorMessage = "Internal Server Error";
    if (typeof error === "object" && error !== null && "message" in error) {
      errorMessage = (error as any).message;
    }
    res.status(500).json({
      status: 500,
      success: false,
      message: errorMessage,
      error,
    });
  }
};
