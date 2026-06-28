// /app/api/miscellaneous/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Miscellaneous from "@/models/Miscellaneous";
import { withTenantGuard, TenantGuardError } from "@/lib/tenantGuard";


export async function GET(req: Request) {
  
    const { tenantId } = await withTenantGuard(req);
try {
    await connectToDatabase();
    const costs = await Miscellaneous.find({ tenantId }).sort({ date: -1 });
    return NextResponse.json({ success: true, costs });
  } catch (err: any) {
    if (err instanceof TenantGuardError) return err.response;
    return NextResponse.json({ success: false, message: err.message });
  }
}

export async function POST(req: Request) {
  
    const { tenantId } = await withTenantGuard(req);
try {
    await connectToDatabase();
    const body = await req.json();
    const cost = await Miscellaneous.create({ ...body, tenantId });
    return NextResponse.json({ success: true, cost });
  } catch (err: any) {
    if (err instanceof TenantGuardError) return err.response;
    return NextResponse.json({ success: false, message: err.message });
  }
}
