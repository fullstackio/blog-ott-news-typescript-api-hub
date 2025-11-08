import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECREATE_TOKEN || "your_secret_key";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: 401,
      success: false,
      message: "Access token missing or malformed",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // @ts-ignore
    const { id, setEmail, setStatus, setAccountStatus } = decoded as {
      id?: string;
      setemail?: string;
      setStatus?: string;
      setAccountStatus?: boolean;
    };

    if (!id || !setEmail) {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Invalid token: missing user info",
      });
    }

    if (setStatus !== "approve") {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Invalid token: Account is not active",
      });
    }

    if (!setAccountStatus) {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Invalid token: Email idis not approved",
      });
    }

    // @ts-ignore
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      status: 403,
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    const userRole = req.user?.setRole;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        status: 403,
        success: false,
        message: `Access denied for role: ${userRole}`,
      });
    }

    next();
  };
};
