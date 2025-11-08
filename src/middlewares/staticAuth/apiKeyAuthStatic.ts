import { Request, Response, NextFunction } from "express";

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const clientApiKey = req.headers["x-api-key"] || req.get("x-api-key");

  console.log("Client API Key:", clientApiKey);
  console.log("Env API Key   :", process.env.API_KEY);

  if (!clientApiKey) {
    return res.status(403).json({
      status: 403,
      success: false,
      message: "API key is missing",
    });
  }

  if (clientApiKey !== process.env.API_KEY) {
    return res.status(401).json({
      status: 401,
      success: false,
      message: "Invalid API key",
    });
  }

  next();
};
