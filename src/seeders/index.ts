import mongoose from "mongoose";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./../config/index";
import { User } from "../models/user/user.model";

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
