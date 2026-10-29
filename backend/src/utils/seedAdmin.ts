import { connectDatabase, closeDatabase } from "../config/database";
import { env } from "../config/env";
import { User } from "../models/User";
import { subscriptionService } from "../services/subscription.service";

const run = async () => {
  if (!env.admin.email || !env.admin.password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }

  await connectDatabase();
  const email = env.admin.email.toLowerCase();
  let user = await User.findOne({ email }).select("+password");

  if (!user) {
    user = new User({
      email,
      fullName: "Admin",
      provider: "local",
      isEmailVerified: true,
    });
  }

  user.password = env.admin.password;
  user.role = "admin";
  user.provider = "local";
  user.isEmailVerified = true;
  await user.save();

  await subscriptionService.updateManual(user.id, "active", 12);
  await closeDatabase();
  console.info(`Admin ready: ${user.email}`);
};

run().catch(async (error) => {
  console.error(error);
  await closeDatabase();
  process.exit(1);
});
