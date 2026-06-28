import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Tenant from "@/models/Tenant";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ success: false, error: "Slug is required" }, { status: 400 });
    }

    const tenant = await Tenant.findOne({ slug }).lean();
    if (!tenant) {
      return NextResponse.json({ success: false, exists: false });
    }

    return NextResponse.json({
      success: true,
      exists: true,
      tenantId: (tenant as any)._id.toString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
