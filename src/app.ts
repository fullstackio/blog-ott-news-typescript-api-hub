import express from "express";
import corsMiddleware from "./middlewares/cors/cors.middleware";
import loggerMiddleware from "./middlewares/loggers/logger.middleware";
import routes from "./routes/routes";
import { setupSwagger } from "./swagger";

const app = express();

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middlewares
app.use(corsMiddleware);
app.use(loggerMiddleware);

// Swagger Docs
setupSwagger(app);

// Set Main Route
app.use("/api/v2/", routes);

// Default /api/v2 route for health/welcome
app.get("/api/v2", (req, res) => {
  res.json({
    status: "success",
    message: "Welcome to the News Blog OTT API!",
    docs: "/api-docs",
  });
});

export default app;
