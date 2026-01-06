// swagger.ts
import dotenv from "dotenv";
dotenv.config();
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const PORT = process.env.PORT || 5006;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "News Blog OTT API",
      version: "1.0.0",
      description: "API documentation for News Blog OTT Node.js project",
    },
    servers: [
      {
        url: `http://localhost:8060/api/v2`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/**/*.ts", "./src/controllers/**/*.ts"], // adjust as needed
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
