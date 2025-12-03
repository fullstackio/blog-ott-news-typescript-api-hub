import { Request, Response } from "express";
import os from "os";
import { networkInterfaces } from "os";
import { getDeviceInfo } from "../../utils/helper/deviceInfo.helper";
import UserSubscription from "../../models/userSubscription.model";

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email } = req.body;

    // Check if email already exists in subscriptions
    const existing = await UserSubscription.findOne({ email });
    if (existing) {
      return res.status(409).json({
        status: 409,
        success: false,
        message: "You are already subscribed to our Newsletter",
      });
    }

    // Check if email exists in Admin collection with admin/superadmin role
    const Admin = require("../../models/admin.model").default;
    const adminExists = await Admin.findOne({
      email,
      role: {
        $in: ["superadmin", "admin", "user", "buyer", "seller", "agent"],
      },
    });
    if (adminExists) {
      return res.status(409).json({
        status: 409,
        success: false,
        message: `This email is already registered as ${adminExists.role} in our system.`,
      });
    }

    // Get device info using helper
    const deviceInfo = getDeviceInfo(req);

    // Get unique, non-internal, non-empty MAC addresses
    const macAddresses = Array.from(
      new Set(
        Object.values(networkInterfaces)
          .flat()
          .filter(
            (iface) =>
              iface &&
              !iface.internal &&
              iface.mac &&
              iface.mac !== "00:00:00:00:00:00" &&
              iface.mac !== ""
          )
          .map((iface) => iface && iface.mac)
      )
    );

    // Build server info
    const serverInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      architecture: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      macAddresses,
    };

    const subscription = await UserSubscription.create({
      firstName,
      lastName,
      email,
      deviceInfo,
      setSystemServerInfo: serverInfo,
      isActive: true,
      isDeleted: false,
    });

    res.status(201).json({
      status: 201,
      success: true,
      message: "Subscription created successfully",
      data: subscription,
    });
    // Send subscription email to subscriber and admin
    try {
      const {
        sendSubscriptionEmails,
      } = require("../../services/mailer/subscriptionMail.service");
      await sendSubscriptionEmails(subscription);
    } catch (mailError) {
      // Optionally log mail errors, but don't block response
      console.error("Failed to send subscription email:", mailError);
    }
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

export const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const subscriptions = await UserSubscription.find().sort({ createdAt: -1 });

    // Handle no data found
    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "No subscriber found",
        data: [],
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Subscriptions fetched successfully",
      data: subscriptions,
    });
  } catch (error) {
    // Network error handling
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      (error as any).name === "MongoNetworkError"
    ) {
      return res.status(503).json({
        status: 503,
        success: false,
        message: "Network error: Unable to connect to database",
        error,
      });
    }

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
