/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and User Management
 */

/**
 * @swagger
 * /admin/signin:
 *   post:
 *     summary: User sign in
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               passWord:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid credentials
 */
const express = require("express");
const router = express.Router();
const adminControllers = require("../../controllers/authControllers/auth.controller");
import { SingnInValidate } from "../../middlewares/authMiddleware/signinValidator.middleware";
import { SingnUPValidate } from "../../middlewares/authMiddleware/signupValidator.middleware";
import { apiKeyAuth } from "../../middlewares/staticAuth/apiKeyAuthStatic";
import { loginFormSchema } from "../../validation/authValidator/signin.validator";
import { registrationFormSchema } from "../../validation/authValidator/signup.validator";

// Signin route
router
  .route("/signin")
  .post(SingnInValidate(loginFormSchema), adminControllers.signIn);

/**
 * @swagger
 * /admin/signup:
 *   post:
 *     summary: User sign up
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               userGender:
 *                 type: string
 *                 enum: [male, female, other]
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               passWord:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists or validation error
 */
router
  .route("/signup")
  .post(SingnUPValidate(registrationFormSchema), adminControllers.signUp);

/**
 * @swagger
 * /admin/refresh-token:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid or expired refresh token
 */

// Refresh Token
router.route("/refresh-token").post(adminControllers.refreshToken);

/**
 * @swagger
 * /admin/get-users:
 *   get:
 *     summary: Get all users
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: List of users
 */

// Get All Users Data
router.route("/get-users").get(apiKeyAuth, adminControllers.getUsers);

/**
 * @swagger
 * /admin/get-user-single/{id}:
 *   get:
 *     summary: Get single user by ID
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */

// Get Single User Data
router.route("/get-user-single/:id").get(adminControllers.singleUser);

/**
 * @swagger
 * /admin/get-draft-users:
 *   get:
 *     summary: Get all draft users
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: List of draft users
 */

// Get All Users Data
router.route("/get-draft-users").get(adminControllers.getDraftUsers);

/**
 * @swagger
 * /admin/edit-user/{id}:
 *   put:
 *     summary: Edit user by ID
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 */

// Edit User Data
router.route("/edit-user/:id").put(adminControllers.editUser);

/**
 * @swagger
 * /admin/delete-user-soft/{id}:
 *   delete:
 *     summary: Soft delete user by ID
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User soft deleted
 *       404:
 *         description: User not found
 */

// Delete User Data
router.route("/delete-user-soft/:id").delete(adminControllers.deleteUserSoft);

/**
 * @swagger
 * /admin/delete-user-hard/{id}:
 *   delete:
 *     summary: Hard delete user by ID
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User hard deleted
 *       404:
 *         description: User not found
 */

router.route("/delete-user-hard/:id").delete(adminControllers.deleteUserHard);

/**
 * @swagger
 * /admin/delete-user/{id}:
 *   delete:
 *     summary: Delete user by ID (alias for hard delete)
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */

router.route("/delete-user/:id").delete(adminControllers.deleteUserHard);

export default router;
