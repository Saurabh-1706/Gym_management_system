import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Tenant from "@/models/Tenant";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET -> fetch all tenants
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();
    const tenants = await Tenant.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, tenants });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT -> update tenant status or plan
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();
    const { id, isActive, plan, planLimits } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "Tenant ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (plan !== undefined) updateData.plan = plan;
    if (planLimits !== undefined) updateData.planLimits = planLimits;

    const updated = await Tenant.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, tenant: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
