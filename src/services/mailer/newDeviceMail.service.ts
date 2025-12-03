import nodemailer from "nodemailer";

// You may want to use your existing mail config or import a shared mailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendNewDeviceLoginMail({
  to,
  userName,
  userEmail,
  userId,
  deviceId,
  deviceDetails,
}: {
  to: string;
  userName: string;
  userEmail: string;
  userId: string;
  deviceId: string;
  deviceDetails: any;
}) {
  const subject = "New Device Login Alert";
  const html = `
    <h2>New Device Login Detected</h2>
    <p>Hello <strong>${userName}</strong>,</p>
    <p>Your account <strong>${userEmail}</strong> (User ID: <strong>${userId}</strong>) was just accessed from a new device.</p>
    <ul>
      <li><strong>Device ID:</strong> ${deviceId}</li>
      <li><strong>Device Details:</strong></li>
      <ul>
        ${
          deviceDetails
            ? Object.entries(deviceDetails)
                .map(([key, value]) => `<li>${key}: ${value}</li>`)
                .join("")
            : "No details available"
        }
      </ul>
    </ul>
    <p>If this was not you, please secure your account immediately.</p>
    <p>Thank you,<br/>Security Team</p>
  `;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || "no-reply@example.com",
    to,
    subject,
    html,
  });
}
