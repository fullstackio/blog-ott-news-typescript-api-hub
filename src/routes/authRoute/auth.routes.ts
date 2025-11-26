const express = require("express");
const router = express.Router();
const adminControllers = require("../../controllers/authControllers/auth.controller");
import { SingnInValidate } from "../../middlewares/authMiddleware/signinValidator.middleware";
import { SingnUPValidate } from "../../middlewares/authMiddleware/signupValidator.middleware";
import { apiKeyAuth } from "../../middlewares/staticAuth/apiKeyAuthStatic";
import { recheckEmailOtp } from "../../validation/authValidator/recheck.userEmail";
import { userOtpValidation } from "../../validation/authValidator/signin.userValidator";
import { loginFormSchema } from "../../validation/authValidator/signin.validator";
import { registrationFormSchema } from "../../validation/authValidator/signup.validator";

// Signin route

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
 *                 description: User's email address
 *               passWord:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: User logged in successfully, tokens returned
 *       400:
 *         description: Email or password is required
 *       401:
 *         description: Invalid credentials or user does not exist
 *       403:
 *         description: Account not verified, suspended, inactive, or deactivated
 *       500:
 *         description: Internal Server Error
 */
router
  .route("/signin")
  .post(SingnInValidate(loginFormSchema), adminControllers.signIn);

/**
 * @swagger
 * /admin/verify-user-account:
 *   post:
 *     summary: Verify user account with OTP
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
 *                 description: User's email address
 *               otp:
 *                 type: string
 *                 description: One-time password sent to user's email
 *     responses:
 *       200:
 *         description: OTP verified, account activated, welcome mail sent
 *       400:
 *         description: Email and OTP are required
 *       401:
 *         description: Invalid OTP
 *       404:
 *         description: User not found
 *       410:
 *         description: OTP expired
 *       500:
 *         description: Internal Server Error
 */

router
  .route("/verify-user-account")
  .post(SingnInValidate(userOtpValidation), adminControllers.verifyOtp);
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
 *                 description: User's first name
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *               userGender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 description: User's gender
 *               email:
 *                 type: string
 *                 description: User's email address
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *               passWord:
 *                 type: string
 *                 description: User's password
 *               country:
 *                 type: string
 *                 description: Country
 *               state:
 *                 type: string
 *                 description: State
 *               city:
 *                 type: string
 *                 description: City
 *               dob:
 *                 type: string
 *                 format: date
 *                 description: Date of birth
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists or validation error
 *       500:
 *         description: Internal Server Error
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

router
  .route("/recheck-user-email")
  .post(SingnInValidate(recheckEmailOtp), adminControllers.recheckEmail);

export default router;
