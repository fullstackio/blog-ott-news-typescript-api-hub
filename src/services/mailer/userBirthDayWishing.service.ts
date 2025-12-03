import nodemailer from "nodemailer";

interface BirthdayMailOptions {
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
  dob?: Date | string;
}

export async function sendBirthdayWishingMail(options: BirthdayMailOptions) {
  const { firstName, lastName, email, userId, dob } = options;

  // Create mail transporter (customize as needed)
  const transporter = nodemailer.createTransport({
    // Example config, replace with your SMTP details
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Format birthday (optional)
  let birthdayString = "";
  if (dob) {
    if (typeof dob === "string") {
      birthdayString = dob;
    } else if (dob instanceof Date) {
      birthdayString = dob.toLocaleDateString();
    }
  }

  // Email content
  const mailOptions = {
    from: process.env.SMTP_FROM || "no-reply@yourdomain.com",
    to: email,
    subject: `Happy Birthday in Advance, ${firstName}! 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Dear ${firstName} ${lastName},</h2>
        <p>We noticed your birthday is coming up on <strong>${birthdayString}</strong>!</p>
        <p>Wishing you a wonderful year ahead filled with joy, success, and happiness.</p>
        <p>Enjoy your special day in advance!</p>
        <br>
        <p>Best wishes,<br>The News Blog OTT Team</p>
      </div>
    `,
  };

  // Send mail
  await transporter.sendMail(mailOptions);
}
