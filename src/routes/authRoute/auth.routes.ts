const express = require("express");
const router = express.Router();
const adminControllers = require("../../controllers/authControllers/auth.controller");
import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/apiAccessibility/authenticate";
import { SingnInValidate } from "../../middlewares/authMiddleware/signinValidator.middleware";
import { SingnUPValidate } from "../../middlewares/authMiddleware/signupValidator.middleware";
import { apiKeyAuth } from "../../middlewares/staticAuth/apiKeyAuthStatic";
import { recheckOtpPasswordReset } from "../../validation/authValidator/otpVerifyResetPassword.valodator";
import { recheckEmailOtp } from "../../validation/authValidator/recheck.userEmail";
import { resetPasswordValidation } from "../../validation/authValidator/resetPassword.validator";
import { userOtpValidation } from "../../validation/authValidator/signin.userValidator";
import { loginFormSchema } from "../../validation/authValidator/signin.validator";
import { registrationFormSchema } from "../../validation/authValidator/signup.validator";

// Signin route

router
  .route("/signin")
  .post(SingnInValidate(loginFormSchema), adminControllers.signIn);

router
  .route("/verify-user-account")
  .post(SingnInValidate(userOtpValidation), adminControllers.verifyOtp);
router
  .route("/signup")
  .post(SingnUPValidate(registrationFormSchema), adminControllers.signUp);

// Refresh Token
router.route("/refresh-token").post(adminControllers.refreshToken);

// Get All Users Data
router
  .route("/get-users")
  .get(
    authenticate,
    authorizeRoles("superadmin", "admin"),
    adminControllers.getUsers
  );

// Get Single User Data
router.route("/get-user-single/:id").get(adminControllers.singleUser);

// Get All Users Data
router.route("/get-draft-users").get(adminControllers.getDraftUsers);

// Edit User Data
router.route("/edit-user/:id").put(adminControllers.editUser);

// Delete User Data
router.route("/delete-user-soft/:id").delete(adminControllers.deleteUserSoft);

router.route("/delete-user-hard/:id").delete(adminControllers.deleteUserHard);

router.route("/delete-user/:id").delete(adminControllers.deleteUserHard);

router
  .route("/recheck-user-email")
  .post(SingnInValidate(recheckEmailOtp), adminControllers.recheckEmail);

router
  .route("/otp-verify-password-reset")
  .post(
    SingnInValidate(recheckOtpPasswordReset),
    adminControllers.verifyPasswordResetOtp
  );

router
  .route("/reset-password")
  .put(
    SingnInValidate(resetPasswordValidation),
    adminControllers.resetPassword
  );

router
  .route("/signed-in-users")
  .get(
    authenticate,
    authorizeRoles("superadmin"),
    adminControllers.getSignedInUsers
  );

router
  .route("/me")
  .get(
    authenticate,
    authorizeRoles("superadmin", "admin", "user", "buyer", "seller", "agent"),
    adminControllers.getSignedInUserDetails
  );

router
  .route("/logout")
  .post(
    authenticate,
    authorizeRoles("superadmin", "admin", "user", "buyer", "seller", "agent"),
    adminControllers.logout
  );

export default router;
