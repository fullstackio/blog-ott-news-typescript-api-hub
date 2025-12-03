import Admin from "../models/admin.model";
import mongoose from "mongoose";

async function migrateTenantFields() {
  const {
    getTenantDbName,
    getTenantConnectionUri,
  } = require("../config/tenantDb");
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/news-blog-ott"
  );
  const users = await Admin.find({
    $or: [{ tenantId: null }, { dbName: null }, { connectionUri: null }],
  });
  for (const user of users) {
    const tenantId = user._id.toString();
    const dbName = getTenantDbName(tenantId);
    const connectionUri = getTenantConnectionUri(tenantId);
    user.tenantId = tenantId;
    user.dbName = dbName;
    user.connectionUri = connectionUri;
    await user.save();
    console.log(`Updated user ${user.email} with tenantId: ${tenantId}`);
  }
  console.log("Migration complete.");
  process.exit(0);
}

migrateTenantFields().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
