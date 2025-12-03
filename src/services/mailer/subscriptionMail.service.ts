import { sendMailService } from "./mail.service";
import { MailOptions } from "../../types/mailOptions.interface";

export async function sendSubscriptionEmails(subscription: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  // Subscriber mail options
  const subscriberMail: MailOptions = {
    from: "testingfullstackapplication@gmail.com",
    to: subscription.email,
    subject: "Newsletter Subscription Confirmation",
    text: `Hello ${subscription.firstName} ${subscription.lastName},\nThank you for subscribing to our newsletter!`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Welcome to Our Newsletter!</h2>
        <p>Hi <strong>${subscription.firstName} ${subscription.lastName}</strong>,</p>
        <p>Thank you for subscribing to our newsletter. You'll now receive the latest updates, news, and exclusive content directly to your inbox.</p>
        <hr>
        <p style="font-size: 12px; color: #888;">If you did not subscribe, please ignore this email.</p>
      </div>
    `,
  };

  // Dynamically fetch admin email
  const Admin = require("../../models/admin.model").default;
  const admin = await Admin.findOne({
    role: "superadmin",
    isActive: true,
    status: "active",
  });
  const adminEmail = admin ? admin.email : "fullstack.avi@gmail.com";

  // Admin mail options
  const adminMail: MailOptions = {
    from: "testingfullstackapplication@gmail.com",
    to: adminEmail,
    subject: "New Newsletter Subscriber",
    text: `New subscriber: ${subscription.firstName} ${subscription.lastName} (${subscription.email})`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>New Newsletter Subscriber</h2>
        <p><strong>Name:</strong> ${subscription.firstName} ${subscription.lastName}</p>
        <p><strong>Email:</strong> ${subscription.email}</p>
        <hr>
        <p style="font-size: 12px; color: #888;">This is an automated notification for a new newsletter subscription.</p>
      </div>
    `,
  };

  await sendMailService(subscriberMail);
  await sendMailService(adminMail);
}
