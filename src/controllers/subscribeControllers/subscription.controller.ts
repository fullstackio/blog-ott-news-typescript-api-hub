import { Request, Response } from "express";
import os from "os";
import { networkInterfaces } from "os";
import { getDeviceInfo } from "../../utils/helper/deviceInfo.helper";
import UserSubscription from "../../models/userSubscription.model";

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email } = req.body;

    // Check if email already exists
    const existing = await UserSubscription.findOne({ email });
    if (existing) {
      return res.status(409).json({
        status: 409,
        success: false,
        message: "You are already subscribed to our Newsletter",
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
      const { sendMailService } = require("../../services/mailer/mail.service");
      const subscriberMail = {
        from: "testingfullstackapplication@gmail.com",
        to: subscription.email,
        subject: "Newsletter Subscription Confirmation",
        text: `Hello ${subscription.firstName} ${subscription.lastName},\nThank you for subscribing to our newsletter!`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Welcome to Our Newsletter!</h2>
            <p>Hi <strong>${subscription.firstName} ${subscription.lastName}</strong>,</p>
            <p>Thank you for subscribing to our newsletter. You'll now receive the latest updates, news, and exclusive content directly to your inbox.</p>
            <hr>
            <p style="font-size: 12px; color: #888;">If you did not subscribe, please ignore this email.</p>
          </div>
        `,
      };
      // Admin mail options
      const adminMail = {
        from: "testingfullstackapplication@gmail.com",
        to: "fullstack.avi@gmail.com", // Replace with actual admin email
        subject: "New Newsletter Subscriber",
        text: `New subscriber: ${subscription.firstName} ${subscription.lastName} (${subscription.email})`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>New Newsletter Subscriber</h2>
            <p><strong>Name:</strong> ${subscription.firstName} ${subscription.lastName}</p>
            <p><strong>Email:</strong> ${subscription.email}</p>
            <hr>
            <p style="font-size: 12px; color: #888;">This is an automated notification for a new newsletter subscription.</p>
          </div>
        `,
      };
      await sendMailService(subscriberMail);
      await sendMailService(adminMail);
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
