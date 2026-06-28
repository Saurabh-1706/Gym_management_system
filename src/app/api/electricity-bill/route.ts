import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ElectricityBill from "@/models/ElectricityBill";
import { withTenantGuard, TenantGuardError } from "@/lib/tenantGuard";


// POST → Add new bill
export async function POST(req: Request) {
  
    const { tenantId } = await withTenantGuard(req);
try {
    await connectToDatabase();
    const body = await req.json();
    const bill = await ElectricityBill.create({ ...body, tenantId });
    return NextResponse.json({ success: true, bill });
  } catch (err) {
    if (err instanceof TenantGuardError) return err.response;
    return NextResponse.json({ success: false, error: err });
  }
}

// GET → Fetch all bills
export async function GET(req: Request) {
  
    const { tenantId } = await withTenantGuard(req);
try {
    await connectToDatabase();
    const bills = await ElectricityBill.find({ tenantId }).sort({ year: -1, month: -1 });
    return NextResponse.json({ success: true, bills });
  } catch (err) {
    if (err instanceof TenantGuardError) return err.response;
    return NextResponse.json({ success: false, error: err });
  }
}
