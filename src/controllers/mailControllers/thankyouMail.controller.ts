import { Request, Response } from 'express';  // Import service
import { sendMailService } from '../../services/mailer/mail.service';

export const sendThankYouMail = async (req: Request, res: Response) => {
  try {
    const mailOptions = {
      from: 'test.email@gmail.com',
      to: 'testingfullstackapplication@gmail.com', // Dynamically get recipient
      subject: 'Thank You for Joining Us!',
      text: 'Thank you for being part of our community! We appreciate your support.',
    };
    const result = await sendMailService(mailOptions);  // Pass custom mail options to service
    res.status(200).json({ message: 'Thank you mail sent successfully!', result });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send thank you mail', error });
  }
};