import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Tenant from "@/models/Tenant";
import User from "@/models/User";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Access Denied: Only Super Admins can register new gyms." }, { status: 403 });
    }

    await connectToDatabase();
    const { gymName, slug, ownerName, email, password } = await req.json();

    if (!gymName || !slug || !ownerName || !email || !password) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 });
    }

    // URL safe regex validation for slug
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json({ success: false, error: "Slug must be lowercase alphanumeric and hyphens only." }, { status: 400 });
    }

    // 1. Verify slug uniqueness
    const existingTenant = await Tenant.findOne({ slug }).lean();
    if (existingTenant) {
      return NextResponse.json({ success: false, error: "Gym URL (slug) is already taken." }, { status: 400 });
    }

    // 2. Verify email uniqueness
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email is already registered." }, { status: 400 });
    }

    // 3. Create Tenant
    const tenant = await Tenant.create({
      name: gymName,
      slug,
      ownerEmail: email,
      primaryColor: "#F97316",
      plan: "free",
      isActive: true,
      planLimits: { maxMembers: 100, maxStaff: 5 },
    });

    // 4. Hash password and Create User
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      tenantId: tenant._id,
      name: ownerName,
      email,
      password: hashedPassword,
      role: "gym_admin",
    });

    return NextResponse.json({ success: true, slug: tenant.slug });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
