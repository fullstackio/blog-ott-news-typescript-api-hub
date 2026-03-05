import dotenv from "dotenv";
dotenv.config();
import colors from "colors";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db";
import { setSocketIoInstance } from "./socket/socket";
import app from "./app";
import logger from "./utils/logger";
import "./services/cron/cron.services";

const PROTOCOL = "http"; // or https
const HOST = "127.0.0.1";
const PORT = process.env.PORT || 5006;

const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*", // allow all origins for now (you can restrict later)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "FIND"],
  },
});

// Store `io` globally so it can be used in routes/middlewares
setSocketIoInstance(io);

// Database connected and Server Running
connectDB()
  .then(async () => {
    server.listen(PORT, async () => {
      try {
        // Gather system/app info
        const execSync = (await import("child_process")).execSync;
        const os = (await import("os")).default;
        // Node versions
        const systemNodeVersion = execSync("node -v").toString().trim();
        const appNodeVersion = process.version;
        // NPM version
        let npmVersion = "N/A";
        try {
          npmVersion = execSync("npm -v").toString().trim();
        } catch (e) {}
        // MongoDB version (local)
        let mongoLocalVersion = "N/A";
        try {
          mongoLocalVersion =
            execSync("mongod --version")
              .toString()
              .match(/db version v([\d.]+)/)?.[1] || "N/A";
        } catch (e) {}
        // MongoDB version (application/driver)
        let mongoAppVersion = "N/A";
        try {
          const pkg = await import("mongoose/package.json");
          mongoAppVersion = pkg.version;
        } catch (e) {}
        // Environment
        const nodeEnv = process.env.NODE_ENV || "development";
        // MongoDB connection info (Atlas/Compass)
        let mongoConnType = "Unknown";
        let mongoConnDesc = "";
        const isDevelopment = process.env.NODE_ENV === "development";
        const mongoUri = isDevelopment
          ? process.env.MONGO_URI_COMPASS
          : process.env.MONGO_URI_ATLAS;

        if (mongoUri) {
          if (
            mongoUri.includes("localhost") ||
            mongoUri.includes("127.0.0.1")
          ) {
            mongoConnType = "Local MongoDB (Compass)";
            mongoConnDesc = "Connecting to Local MongoDB (Compass)";
          } else if (mongoUri.includes("mongodb+srv")) {
            mongoConnType = "Cloud MongoDB (Atlas)";
            mongoConnDesc = "Connecting to Cloud MongoDB (Atlas)";
          } else {
            mongoConnType = "Remote MongoDB";
            mongoConnDesc = "Connecting to Remote MongoDB";
          }
        }
        // Date/time
        const now = new Date();
        const dateStr = now.toISOString().replace("T", " ").substring(0, 19);
        const fullDateTime = now.toLocaleString("en-US", {
          timeZoneName: "long",
        });
        // Server uptime
        const uptimeSec = process.uptime();
        const uptimeH = Math.floor(uptimeSec / 3600);
        const uptimeM = Math.floor((uptimeSec % 3600) / 60);
        const uptimeS = Math.floor(uptimeSec % 60);
        const serverUptime = `${uptimeH}h ${uptimeM}m ${uptimeS}s`;
        // Table output
        const table = [
          {
            Key: "🌐 Node Environment",
            Value: nodeEnv.charAt(0).toUpperCase() + nodeEnv.slice(1),
          },
          { Key: "🔗 MongoDB Connection", Value: mongoConnType },
          { Key: "Connection Detail", Value: mongoConnDesc },
          { Key: "System Node Version", Value: systemNodeVersion },
          { Key: "App Node Version", Value: appNodeVersion },
          { Key: "NPM Version", Value: npmVersion },
          { Key: "Mongo Version (Local)", Value: mongoLocalVersion },
          { Key: "Mongo Version (App/Driver)", Value: mongoAppVersion },
          { Key: "Server URL", Value: `${PROTOCOL}://${HOST}:${PORT}` },
          { Key: "Server Uptime", Value: serverUptime },
          { Key: "Time", Value: fullDateTime },
        ];
        console.log(colors.cyan("=".repeat(60)));
        console.table(table);
        console.log(colors.cyan("=".repeat(60)));
        // Additional log lines
        console.log(colors.green(`[${dateStr}] [INFO]: MongoDB Connected`));
        if (mongoConnType === "Cloud MongoDB (Atlas)") {
          console.log(
            colors.green("✅ MongoDB Database Connected with Atlas Server")
          );
        } else if (mongoConnType === "Local MongoDB (Compass)") {
          console.log(
            colors.green("✅ MongoDB Database Connected with Compass Server")
          );
        } else {
          console.log(colors.green("✅ MongoDB Database Connected"));
        }
        console.log(
          colors.yellow("Server is running at"),
          colors.bgGreen(`${PROTOCOL}://${HOST}:${PORT}`)
        );
        logger.info(`Server log at ${PROTOCOL}://${HOST}:${PORT}`);
      } catch (err) {
        console.error("Internal Server Error from API Server", err);
      }
    });
  })
  .catch((err) => {
    console.log(colors.red(`Failed to connect database`), err.message);
  });
