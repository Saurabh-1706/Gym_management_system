import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Inventory from "@/models/Inventory";
import { withTenantGuard, TenantGuardError } from "@/lib/tenantGuard";


export async function PUT(req: Request, context: any) {
  
    const { tenantId } = await withTenantGuard(req);
try {
    await connectToDatabase();

    const { id } = context.params;
    const body = await req.json();

    const updated = await Inventory.findOneAndUpdate({ _id: id, tenantId }, body, { new: true });
    return NextResponse.json({ item: updated });
  } catch (err) {
    if (err instanceof TenantGuardError) return err.response;
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, context: any) {
  
    const { tenantId } = await withTenantGuard(req);
try {
    await connectToDatabase();

    const { id } = context.params;

    await Inventory.findOneAndDelete({ _id: id, tenantId });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof TenantGuardError) return err.response;
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
