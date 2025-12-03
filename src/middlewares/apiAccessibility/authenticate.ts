import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

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
    console.log("[DEBUG] JWT_SECRET used for verification:", JWT_SECRET);
    const decoded = jwt.verify(token, JWT_SECRET);

    // Accept both setemail and email, and both 'active' and 'approve' as valid status
    const { id, setEmail, setemail, email, setStatus, status, isActive, role } =
      decoded as {
        id?: string;
        setemail?: string;
        setEmail?: string;
        email?: string;
        setStatus?: string;
        status?: string;
        isActive?: boolean;
        role?: string;
      };

    const emailValue = setEmail || setemail || email;
    if (!id || !emailValue) {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Invalid token: missing user info",
      });
    }

    const statusValue = setStatus || status;
    const isActiveValue = isActive === true;
    const statusActive = statusValue === "active";
    console.log("[AUTH] Token payload:", {
      id,
      emailValue,
      statusValue,
      isActive,
      role,
    });
    if (!statusActive) {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Invalid token: Account is not active",
      });
    }
    if (!isActiveValue) {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Invalid token: Email id is not approved",
      });
    }

    // Attach decoded user to request for downstream role checks
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    return res.status(403).json({
      status: 403,
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    // Use 'role' field from JWT payload
    const userRole = req.user?.role || req.user?.setRole;
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
