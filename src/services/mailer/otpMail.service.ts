// src/services/mailer/otpMail.service.ts
import { sendMailService } from "./mail.service";

interface OtpMailOptions {
  firstName: string;
  lastName: string;
  email: string;
  otp: string | number;
  otpExpires: string | number | Date | undefined;
  timeZone?: string;
}

// Example MailOptions interface
export interface MailOptions {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  // other properties...
}

export async function sendOtpMail(options: OtpMailOptions) {
  const { firstName, lastName, email, otp, otpExpires, timeZone } = options;

  // Format expiry time
  const expiryDate = otpExpires ? new Date(otpExpires) : new Date();
  const expiryUTC = expiryDate.toLocaleString("en-US", { timeZone: "UTC" });
  const expiryLocal = expiryDate.toLocaleString("en-US", {
    timeZone: timeZone || "Asia/Kolkata",
  });

  // ----------------------------
  // HTML TEMPLATE
  // ----------------------------
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background:#f5f5f5;">
      <div style="max-width: 500px; margin: auto; background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <h2 style="color: #333;">🔐 Verify Your Account</h2>

        <p style="font-size: 16px; color: #555;">
          Hello <strong>${firstName} ${lastName}</strong>,
        </p>

        <p style="font-size: 16px; color: #555;">
          Your One-Time Password (OTP) for account verification is:
        </p>

        <div style="background: #007bff; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 28px; color: white; letter-spacing: 2px;"><strong>${otp}</strong></span>
        </div>

        <p style="font-size: 15px; color: #444;">  
          OTP Expiry Details:
        </p>

        <ul style="font-size: 14px; color: #666; line-height: 1.6;">
          <li><strong>UTC Time:</strong> ${expiryUTC}</li>
          <li><strong>Your Timezone (${
            timeZone || "Asia/Kolkata"
          }):</strong> ${expiryLocal}</li>
          <li>This OTP is valid for <strong>4 hours</strong>.</li>
        </ul>

        <p style="font-size: 14px; color: #555;">
          Thank you for registering with us!  
        </p>

        <br />

        <p style="font-size: 12px; color: #999; text-align:center;">
          If you did not request this OTP, please ignore this email.<br />
          <span style="color: #e53e3e;">This is a system generated email. <strong>Do not reply to this email.</strong></span>
        </p>
      </div>
    </div>
  `;

  // ----------------------------
  // TEXT TEMPLATE (fallback)
  // ----------------------------
  const textTemplate =
    `Hello ${firstName} ${lastName},\n\n` +
    `Your OTP for account verification is: ${otp}\n` +
    `This OTP will expire in 4 hours.\n` +
    `Expiry Time (UTC): ${expiryUTC}\n` +
    `Expiry Time (Your Timezone): ${expiryLocal} (${
      timeZone || "Asia/Kolkata"
    })\n\n` +
    `Thank you for registering!\n`;

  try {
    await sendMailService({
      from: "testingfullstackapplication@gmail.com",
      to: email,
      subject: "Your OTP for Account Verification",
      text: textTemplate,
      html: htmlTemplate,
    });
  } catch (mailError) {
    console.error("Error sending OTP email:", mailError);
  }
}
