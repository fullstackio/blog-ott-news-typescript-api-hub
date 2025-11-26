// Define the MailOptions interface in its own file
export interface MailOptions {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}
