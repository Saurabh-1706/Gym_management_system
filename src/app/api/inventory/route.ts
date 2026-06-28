import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Inventory from "@/models/Inventory";
import { withTenantGuard, TenantGuardError } from "@/lib/tenantGuard";


export async function GET(req: Request) {
  
    const { tenantId } = await withTenantGuard(req);
try {
    await connectToDatabase();
    const items = await Inventory.find({ tenantId });
    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof TenantGuardError) return err.response;
    console.error(err);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  
    const { tenantId } = await withTenantGuard(req);
try {
    await connectToDatabase();
    const body = await req.json();

    // Optional: log the body to see what you are sending
    console.log("POST body:", body);

    const item = await Inventory.create({ ...body, tenantId });
    return NextResponse.json({ item });
  } catch (err) {
    if (err instanceof TenantGuardError) return err.response;
    console.error("Error saving inventory:", err);
    return NextResponse.json({ error: "Failed to save item" }, { status: 500 });
  }
}