import cron from "node-cron";
import Admin from "../../../models/admin.model";

// Import your mail service
import { sendBirthdayWishingMail } from "../../../services/mailer/userBirthDayWishing.service";

// Cron job: runs every day at 5:25 PM
// Cron job: runs every day at 12:00 AM
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("[CRON] Checking for users with birthdays tomorrow...");
    const users = await Admin.find({
      isActive: true,
      status: "active",
      isDeleted: false,
    });
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowMonth = tomorrow.getMonth() + 1; // getMonth() is 0-based
    const tomorrowDay = tomorrow.getDate();
    let wishedCount = 0;
    for (const user of users) {
      if (user.dob) {
        // Assuming user.dob is a string in 'MM/DD/YYYY' format
        if (typeof user.dob === "string") {
          const [month, day] = (user.dob as string).split("/").map(Number);
          if (month === tomorrowMonth && day === tomorrowDay) {
            await sendBirthdayWishingMail({
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              userId: user.userId || "",
              dob: user.dob,
            });
            wishedCount++;
          }
        }
      }
    }
    console.log(`[CRON] Birthday wishes sent to ${wishedCount} users.`);
  } catch (error) {
    console.error("[CRON] Error sending welcome mails:", error);
  }
});
