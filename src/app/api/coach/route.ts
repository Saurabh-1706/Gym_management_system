import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CoachModel from "@/models/Coach";
import { withTenantGuard, TenantGuardError } from "@/lib/tenantGuard";


export async function GET(req: Request) {
  
    const { tenantId } = await withTenantGuard(req);
try {
    await connectToDatabase();
    const coaches = await CoachModel.find({ tenantId });
    return NextResponse.json({ success: true, coaches });
  } catch (err) {
    if (err instanceof TenantGuardError) return err.response;
    console.error(err);
    return NextResponse.json({ success: false, error: (err as Error).message });
  }
}

export async function POST(req: Request) {
  
    const { tenantId } = await withTenantGuard(req);
try {
    await connectToDatabase();
    const body = await req.json();
    const coach = await CoachModel.create({ ...body, tenantId }); // no salary required here
    return NextResponse.json({ success: true, coach });
  } catch (err) {
    if (err instanceof TenantGuardError) return err.response;
    console.error(err);
    return NextResponse.json({ success: false, error: (err as Error).message });
  }
}
