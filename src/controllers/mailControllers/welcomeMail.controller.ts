import { Request, Response } from 'express';  // Import service
import { sendMailService } from '../../services/mailer/mail.service';

export const sendWelcomeMail = async (req: Request, res: Response) => {
  try {
    const mailOptions = {
      from: 'test.email@gmail.com',
      to: 'testingfullstackapplication@gmail.com', // Dynamically get recipient
      subject: 'Welcome to Our Service!',
      text: 'Welcome to our amazing service! We are glad to have you with us.',
    };
    const result = await sendMailService(mailOptions);  // Pass custom mail options to service
    res.status(200).json({ message: 'Welcome mail sent successfully!', result });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send welcome mail', error });
  }
};
