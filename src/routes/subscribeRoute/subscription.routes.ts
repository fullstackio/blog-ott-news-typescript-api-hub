import { Router } from "express";
import { SubscriptionNewsletterValidate } from "../../middlewares/newsLetterSubscriptionMiddleware/subscription.middleware";
import { subscriptionFormSchema } from "../../validation/subscribeNewsletterValidator/subscription.validator";

const NewsletterSubscribeControllers = require("../../controllers/subscribeControllers/subscription.controller");

const router = Router();

function asyncMiddleware(handler: any) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

router
  .route("/subscription")
  .post(
    asyncMiddleware(SubscriptionNewsletterValidate(subscriptionFormSchema)),
    NewsletterSubscribeControllers.createSubscription
  );

router
  .route("/subscription")
  .get(NewsletterSubscribeControllers.getSubscriptions);

export default router;
