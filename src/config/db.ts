import mongoose from "mongoose";
import logger from "../utils/logger";
import { config } from "../config/config";

const connectDB = async () => {
  try {
    const isDevelopment = config.env === "development";

    const MONGO_URI = isDevelopment
      ? config.mongo.localUri
      : config.mongo.atlasUri;

    if (!MONGO_URI) {
      throw new Error("MongoDB URI is not defined");
    }

    console.log(
      `🌐 Node Environment: ${isDevelopment ? "Development" : "Production"}`
    );
    console.log(
      `🔗 Connecting to ${
        isDevelopment ? "Local MongoDB (Compass)" : "Cloud MongoDB (Atlas)"
      }`
    );

    await mongoose.connect(MONGO_URI);

    logger.info("MongoDB Connected");
    console.log(
      `${
        isDevelopment
          ? "✅ MongoDB Database Connected with Compass Server"
          : "✅ MongoDB Database Connected with Atlas Cloude"
      }`
    );
  } catch (error) {
    logger.error("MongoDB connection error", error);
    console.error("❌ MongoDB Database connection error", error);
    process.exit(1);
  }
};

export default connectDB;
