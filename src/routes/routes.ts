import express from "express";
import authRoutes from "./authRoute/auth.routes";
import mailRoutes from "./mailRoute/mail.routes";
import blogsRoutes from "./blogRoute/blog.routes";
import subscriptionRoutes from "./subscribeRoute/subscription.routes";
import userAddressRoutes from "./userRoute/userAddress.routes";

const router = express.Router();

// Routes

router.use("/admin", authRoutes); // /api/v2/auth/login, /api/v2/auth/register
router.use("/mail", mailRoutes); // /api/v2/mail/send-welcome-mail, /api/v2/mail/send-thankyou-mail
router.use("/blog", blogsRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/user", userAddressRoutes);

export default router;
