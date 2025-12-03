import cron from "node-cron";
import Admin from "../../../models/admin.model";

// Helper function to calculate age from dob
function calculateAge(dob: Date | string | undefined): number | undefined {
  if (!dob) return undefined;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Run every day at 00:10 AM
cron.schedule("10 0 * * *", async () => {
  try {
    const users = await Admin.find({ dob: { $exists: true } });
    for (const user of users) {
      const newAge = calculateAge(user.dob);
      if (typeof newAge === "number" && user.currentAge !== newAge) {
        user.set("currentAge", newAge);
        await user.save();
      }
    }
    console.log("[CRON] User currentAge updated for birthdays.");
  } catch (err) {
    console.error("[CRON] Error updating currentAge:", err);
  }
});
