import { Request, Response, NextFunction } from "express";
import passport from "../../config/googleAuth";

export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const googleAuthCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "google",
    { failureRedirect: "/login", session: false },
    (err, user) => {
      if (err || !user) {
        return res.redirect("/login?error=google_auth_failed");
      }
      // Here, issue JWT or session as per your app logic
      // For demo, redirect with user info (not for production)
      return res.json({ success: true, user });
    }
  )(req, res, next);
};
