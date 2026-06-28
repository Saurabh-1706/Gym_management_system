import { connectToDatabase } from "@/lib/mongodb";
import PlanModel from "@/models/Plan";
import { NextResponse } from "next/server";
import { withTenantGuard, TenantGuardError } from "@/lib/tenantGuard";


export async function POST(req: Request) {
  
    const { tenantId } = await withTenantGuard(req);
try {
    await connectToDatabase();
    const body = await req.json();
    const plan = await PlanModel.create({
      tenantId,
      name: body.name,
      validity: Number(body.validity),
      validityType: body.validityType || "months",
      amount: Number(body.amount),
    });
    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    if (error instanceof TenantGuardError) return error.response;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


export async function GET(req: Request) {
  
    const { tenantId } = await withTenantGuard(req);
try {
    await connectToDatabase();
    const plans = await PlanModel.find({ tenantId }).lean(); // returns array of plans
    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    if (error instanceof TenantGuardError) return error.response;
    return NextResponse.json({ success: false, plans: [], error: error.message }, { status: 500 });
  }
}
