import mongoose from "mongoose";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./../config/index";
import { User } from "../models/user/user.model";
import { CountryCapService } from "../models/country-cap/country.cap.service";
import { AdminAuthService } from "../models/admin/admin.auth.service";

const MONGODB_URI = process.env.DATABASE_URL;

async function seedDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI! as string);
    console.log("✅ Connected to MongoDB");

    // ADMIN USER SETUP
    const adminUser = {
      name: "Admin User",
      email: ADMIN_EMAIL as string,
      password: ADMIN_PASSWORD as string,
      role: "admin" as const,
      phoneNumber: "01767122497",
      dateOfBirth: "2000-01-01",
      status: "active" as const,
    };

    console.log("👤 Checking for existing admin...");

    const existingAdmin = await User.findOne({ email: adminUser.email });

    if (!existingAdmin) {
      console.log("🆕 Admin not found. Creating admin user...");

      await User.create(adminUser);

      console.log("✅ Admin user created successfully!");
    } else {
      console.log("ℹ️ Admin already exists. Ensuring status is active...");
      existingAdmin.status = "active";
      await existingAdmin.save();
      console.log("✅ Admin status updated to active!");
    }

    // Country payout caps (spec §2) — global baseline + major golf nations.
    console.log("🌍 Seeding country payout caps...");
    await CountryCapService.ensureSeeded();
    console.log("✅ Country caps seeded.");

    // Separate App-Admin identity (spec §16), from ADMIN_CONSOLE_* env if set.
    console.log("🔐 Seeding App Admin (if configured)...");
    await AdminAuthService.ensureSeeded();
    console.log("✅ App Admin checked.");

    // YOUR OTHER SEEDING LOGIC (users, providers, etc.)
    console.log("\n🎉 Admin setup completed!");
  } catch (error) {
    console.error("❌ Error while seeding database:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Database connection closed");
    process.exit(0);
  }
}

seedDatabase();
