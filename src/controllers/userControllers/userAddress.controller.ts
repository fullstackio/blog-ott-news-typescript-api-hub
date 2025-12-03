import { Request, Response } from "express";
import UserAddress from "../../models/userAddress.model";

export const addUserAddress = async (req: Request, res: Response) => {
  try {
    // _id is obtained from the authenticated user (authToken), not from the request body
    const _id = (req as any).user?.id;
    const { country, state, city, zipCode, address, street, landMark } =
      req.body;
    if (!_id || !country || !state || !city || !zipCode || !address) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Missing required address fields",
      });
    }
    const userAddress = await UserAddress.create({
      _id,
      country,
      state,
      city,
      zipCode,
      address,
      street,
      landMark,
    });

    // Update addressInfo in Admin collection
    try {
      const Admin = require("../../models/admin.model").default;
      await Admin.findByIdAndUpdate(
        _id,
        {
          addressInfo: {
            _id,
            country,
            state,
            city,
            zipCode,
            address,
            street,
            landMark,
          },
        },
        { new: true }
      );
      console.log(`Admin addressInfo updated for _id: ${_id}`);
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
