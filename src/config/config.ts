import dotenv from "dotenv";
dotenv.config(); // must be at the very top

export const config = {
  mongo: {
    localUri: process.env.MONGO_URI_COMPASS,
    atlasUri: process.env.MONGO_URI_ATLAS || "", // Atlas URI from .env
  },
  env: process.env.NODE_ENV || "development", // default to development
};
