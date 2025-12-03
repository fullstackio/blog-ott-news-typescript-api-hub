import { Router } from "express";
import { UserAddressValidate } from "../../middlewares/userAddressMiddleware/userAddress.middleware";
import { userAddressSchema } from "../../validation/userValidator/userAddress.validator";
import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/apiAccessibility/authenticate";
const addressController = require("../../controllers/userControllers/userAddress.controller");

const router = Router();

function asyncMiddleware(handler: any) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

// Add address for user
router
  .route("/address")
  .post(
    authenticate,
    authorizeRoles("superadmin", "admin", "user", "buyer", "seller", "agent"),
    asyncMiddleware(UserAddressValidate(userAddressSchema)),
    addressController.addUserAddress
  );

// Get all addresses for a user
router
  .route("/address/:userId")
  .get(
    authenticate,
    authorizeRoles("superadmin", "admin", "user", "buyer", "seller", "agent"),
    addressController.getUserAddresses
  );

export default router;
