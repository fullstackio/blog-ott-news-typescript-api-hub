// src/services/mailer/welcomeMail.service.ts
import { sendMailService } from "./mail.service";

interface WelcomeMailOptions {
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
}

export async function sendWelcomeMail(options: WelcomeMailOptions) {
  const { firstName, lastName, email, userId } = options;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 2px 8px #f0f0f0; padding: 24px; background: #fafcff;">
      <h2 style="color: #2d3748;">Welcome to Our Platform!</h2>
      <p>Hello <strong>${firstName} ${lastName}</strong>,</p>
      <p>Welcome to our platform! Your account has been successfully activated.</p>
      <p><strong>Your User ID:</strong> ${userId}</p>
      <p>We're excited to have you onboard. If you have any questions, feel free to reach out.</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />
      <p style="color: #e53e3e; font-size: 0.95em;">This is a system generated welcome email. <strong>Do not reply to this email.</strong></p>
      <p style="margin-top: 24px; color: #718096; font-size: 0.95em;">Best regards,<br/>The Team</p>
    </div>
  `;
  const text =
    `Hello ${firstName} ${lastName},\n\n` +
    `Welcome to our platform! Your account has been successfully activated.\n` +
    `Your User ID: ${userId}\n\n` +
    `We're excited to have you onboard. If you have any questions, feel free to reach out.\n\n` +
    `This is a system generated welcome email. Do not reply to this email.\n` +
    `Best regards,\nThe Team`;
  try {
    await sendMailService({
      from: "testingfullstackapplication@gmail.com",
      to: email,
      subject: "Welcome to Our Platform!",
      text,
      html,
    });
  } catch (mailError) {
    console.error("Error sending welcome mail:", mailError);
  }
}
