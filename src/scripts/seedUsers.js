import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in .env.local");
  process.exit(1);
}

// Define inline schemas to avoid ESM compile issues
const TenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  ownerEmail: { type: String, required: true },
  primaryColor: { type: String, default: "#F97316" },
  plan: { type: String, default: "free" },
  isActive: { type: Boolean, default: true },
  planLimits: {
    maxMembers: { type: Number, default: 100 },
    maxStaff: { type: Number, default: 5 },
  },
  createdAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "gym_admin" },
  createdAt: { type: Date, default: Date.now },
});

const Tenant = mongoose.models.Tenant || mongoose.model("Tenant", TenantSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const users = [
  { email: "saurabhmojad1706@gmail.com", name: "Saurabh", password: "S@urabh@1706" },
  { email: "mojadfitness@gmail.com", name: "Gym", password: "Mojad@11102025" },
  { email: "admin@gmail.com", name: "Admin", password: "Admin@123" },
  { email: "saurabhmojad2173@gmail.com", name: "Saurabh Super", password: "Admin@123" }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: "gymapp" });
    console.log("✅ Connected to MongoDB");

    // 1. Ensure default tenant exists
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

    // 2. Seed users
    for (const u of users) {
      // Remove any existing user first to ensure they get updated with the tenantId!
      await User.deleteOne({ email: u.email });
      const hashedPassword = await bcrypt.hash(u.password, 10);
      const created = await User.create({
        tenantId: tenant._id,
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: (u.email === "admin@gmail.com" || u.email === "saurabhmojad2173@gmail.com") ? "super_admin" : "gym_admin"
      });
      console.log(`✅ Created/Updated user: ${created.email} (id: ${created._id}, tenantId: ${created.tenantId})`);
    }

    console.log("🎉 Seeding successfully complete!");
  } catch (error) {
    console.error("❌ Seeding error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
