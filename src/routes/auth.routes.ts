import express from "express";
const router = express.Router();
const adminControllers = require("../controllers/authControllers/auth.controller");

// ...existing routes...

/**
 * @swagger
 * /admin/me:
 *   get:
 *     summary: Get signed-in user details
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Signed-in user details fetched successfully
 *       400:
 *         description: User ID is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
router.get("/me", adminControllers.getSignedInUserDetails);

/**
 * @swagger
 * /admin/logout:
 *   post:
 *     summary: Logout user and set status to inactive
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       400:
 *         description: User ID is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
router.post("/logout", adminControllers.logout);

export default router;
