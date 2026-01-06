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
    // docs: "/api-docs",
  });
});
app.get("/", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>News Blog OTT API</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 600px; margin: auto; }
          h1 { color: #333; }
          a { color: #0070f3; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to the News Blog OTT API!</h1>
          <p>Status: <strong>success</strong></p>
         
          <p>API Base URL: <a href="/api/v2/"><code>/api/v2/</code></a></p>
        </div>
      </body>
    </html>
  `);
});

export default app;
