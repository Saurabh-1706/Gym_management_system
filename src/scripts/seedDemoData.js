import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in .env.local");
  process.exit(1);
}

// Inline schemas for seeding
const TenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  ownerEmail: { type: String },
  primaryColor: { type: String, default: "#F97316" },
  plan: { type: String, default: "free" },
  isActive: { type: Boolean, default: true },
});

const PlanSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId },
  name: { type: String },
  validity: { type: Number },
  validityType: { type: String },
  amount: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

const MemberSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId },
  name: { type: String },
  mobile: { type: String },
  dob: { type: Date },
  joinDate: { type: Date },
  profilePicture: { type: String },
  plan: { type: String },
  status: { type: String },
  payments: { type: Array, default: [] },
});

const CoachSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId },
  name: { type: String },
  mobile: { type: String },
  status: { type: String },
  salaryHistory: { type: Array, default: [] },
  joinDate: { type: Date },
});

const InventorySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId },
  name: { type: String },
  quantity: { type: Number },
  condition: { type: String },
  purchaseDate: { type: Date },
});

const Tenant = mongoose.models.Tenant || mongoose.model("Tenant", TenantSchema);
const Plan = mongoose.models.Plan || mongoose.model("Plan", PlanSchema);
const Member = mongoose.models.Member || mongoose.model("Member", MemberSchema);
const Coach = mongoose.models.Coach || mongoose.model("Coach", CoachSchema);
const Inventory = mongoose.models.Inventory || mongoose.model("Inventory", InventorySchema);

async function seedDemoData() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: "gymapp" });
    console.log("✅ Connected to MongoDB");

    // 1. Find or create the demo-gym tenant
    let tenant = await Tenant.findOne({ slug: "demo-gym" });
    if (!tenant) {
      tenant = await Tenant.create({
        name: "Demo Gym",
        slug: "demo-gym",
        ownerEmail: "admin@gmail.com",
        primaryColor: "#3b82f6", // A nice blue for demo
        plan: "pro",
      });
      console.log(`✅ Created Demo Tenant: ${tenant.name}`);
    } else {
      console.log(`ℹ️ Found Demo Tenant: ${tenant.name}`);
    }

    const tenantId = tenant._id;

    // 2. Clear existing demo data
    await Plan.deleteMany({ tenantId });
    await Member.deleteMany({ tenantId });
    await Coach.deleteMany({ tenantId });
    await Inventory.deleteMany({ tenantId });

    // 3. Create Plans
    const plans = await Plan.insertMany([
      { tenantId, name: "1 Month Pro", validity: 1, validityType: "months", amount: 1500 },
      { tenantId, name: "3 Months Elite", validity: 3, validityType: "months", amount: 4000 },
      { tenantId, name: "6 Months Ultimate", validity: 6, validityType: "months", amount: 7500 },
    ]);
    console.log(`✅ Created ${plans.length} Plans`);

    // 4. Create Members
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + 15);
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - 10);
    const farPastDate = new Date(now);
    farPastDate.setMonth(now.getMonth() - 6);

    const membersData = [
      {
        tenantId, name: "Alex Johnson", mobile: "9876543210", dob: new Date("1995-05-12"),
        joinDate: now, plan: "3 Months Elite", status: "Active",
        payments: [{
          plan: "3 Months Elite", actualAmount: 4000, totalPaid: 4000, remainingAmount: 0,
          paymentStatus: "Paid", createdAt: now,
          installments: [{ amountPaid: 4000, paymentDate: now, modeOfPayment: "UPI" }]
        }]
      },
      {
        tenantId, name: "Sarah Williams", mobile: "9876543211", dob: new Date("1992-08-22"),
        joinDate: farPastDate, plan: "6 Months Ultimate", status: "Active", // Expiring soon
        payments: [{
          plan: "6 Months Ultimate", actualAmount: 7500, totalPaid: 7500, remainingAmount: 0,
          paymentStatus: "Paid", createdAt: farPastDate,
          installments: [{ amountPaid: 7500, paymentDate: farPastDate, modeOfPayment: "Cash" }]
        }]
      },
      {
        tenantId, name: "Michael Chen", mobile: "9876543212", dob: new Date("1988-11-05"),
        joinDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000), plan: "1 Month Pro", status: "Inactive", // Expired
        payments: [{
          plan: "1 Month Pro", actualAmount: 1500, totalPaid: 1500, remainingAmount: 0,
          paymentStatus: "Paid", createdAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
          installments: [{ amountPaid: 1500, paymentDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000), modeOfPayment: "Card" }]
        }]
      },
      {
        tenantId, name: "Jessica Taylor", mobile: "9876543213", dob: new Date("1999-03-30"),
        joinDate: now, plan: "1 Month Pro", status: "Active",
        payments: [{
          plan: "1 Month Pro", actualAmount: 1500, totalPaid: 500, remainingAmount: 1000,
          paymentStatus: "Unpaid", createdAt: now,
          installments: [{ amountPaid: 500, paymentDate: now, modeOfPayment: "Cash" }]
        }]
      }
    ];
    const members = await Member.insertMany(membersData);
    console.log(`✅ Created ${members.length} Members`);

    // 5. Create Coaches
    const coaches = await Coach.insertMany([
      { tenantId, name: "David Miller (Head Coach)", mobile: "9988776655", status: "Active", joinDate: farPastDate },
      { tenantId, name: "Emma Davis (Yoga)", mobile: "9988776656", status: "Active", joinDate: now },
    ]);
    console.log(`✅ Created ${coaches.length} Coaches`);

    // 6. Create Inventory
    const inventory = await Inventory.insertMany([
      { tenantId, name: "Treadmill Pro-X", quantity: 5, condition: "Good", purchaseDate: farPastDate },
      { tenantId, name: "Dumbbell Set (5kg-25kg)", quantity: 2, condition: "Good", purchaseDate: farPastDate },
      { tenantId, name: "Rowing Machine", quantity: 2, condition: "Needs Repair", purchaseDate: farPastDate },
    ]);
    console.log(`✅ Created ${inventory.length} Inventory Items`);

    console.log("🎉 Demo data successfully seeded for demo-gym!");
  } catch (error) {
    console.error("❌ Demo data seeding failed:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

seedDemoData();
