// src/scripts/seedUsers.ts
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import User from "../models/User.js"; // ESM import requires .js at runtime
import Tenant from "../models/Tenant.js";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Ensure MONGODB_URI exists
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in .env.local");
  process.exit(1);
}

// Users to seed
const users = [
  { email: "saurabhmojad1706@gmail.com", name: "Saurabh", password: "S@urabh@1706" },
  { email: "mojadfitness@gmail.com", name: "Gym", password: "Mojad@11102025" },
  { email: "admin@gmail.com", name: "Admin", password: "Admin@123" }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI!, { dbName: "gymapp" });
    console.log("✅ Connected to MongoDB");

    // 1. Create or retrieve a default tenant for seeding
    let tenant = await Tenant.findOne({ slug: "mojad-fitness" });
    if (!tenant) {
      tenant = await Tenant.create({
        name: "Mojad Fitness",
        slug: "mojad-fitness",
        ownerEmail: "mojadfitness@gmail.com",
        primaryColor: "#F97316",
        plan: "free",
        isActive: true,
        planLimits: { maxMembers: 100, maxStaff: 5 }
      });
      console.log(`✅ Created default Tenant: ${tenant.name} (id: ${tenant._id})`);
    } else {
      console.log(`ℹ️ Tenant already exists: ${tenant.name}`);
    }

    // 2. Seed users under this tenant
    for (const u of users) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        const created = await User.create({
          tenantId: tenant._id,
          name: u.name,
          email: u.email,
          password: hashedPassword,
          role: "gym_admin"
        });
        console.log(`✅ Created user: ${created.email} (id: ${created._id})`);
      } else {
        console.log(`ℹ️ User already exists: ${existing.email}`);
      }
    }

    console.log("🎉 Seeding done!");
  } catch (err) {
    console.error("❌ Error seeding users:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedUsers();
