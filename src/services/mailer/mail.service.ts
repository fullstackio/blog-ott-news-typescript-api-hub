import dotenv from 'dotenv';
dotenv.config();  // This must be called before accessing process.env variables
import nodemailer from 'nodemailer';
import { MailOptions } from '../../types/mailOptions.interface';

export const sendMailService = async (mailOptions: MailOptions) => {



 // Create transporter
 const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'testingfullstackapplication@gmail.com',
    pass: 'nevz qjtc dvtb pyvu',
  },
  logger: true, // Enable logging for debugging
  debug: true,  // Print detailed debug information
});

  const info = await transporter.sendMail(mailOptions);
  return info;  // Return the result to the controller
};
