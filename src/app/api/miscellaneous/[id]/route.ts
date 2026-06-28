import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Miscellaneous from "@/models/Miscellaneous";
import { withTenantGuard, TenantGuardError } from "@/lib/tenantGuard";


export async function PUT(req: Request, context: any) {
  
    const { tenantId } = await withTenantGuard(req);
try {
    await connectToDatabase();

    const { id } = context.params;
    const body = await req.json();

    const updated = await Miscellaneous.findOneAndUpdate({ _id: id, tenantId }, body, { new: true });
    if (!updated)
      return NextResponse.json({ success: false, message: "Cost not found" });

    return NextResponse.json({ success: true, updated });
  } catch (err: any) {
    if (err instanceof TenantGuardError) return err.response;
    console.error("❌ Error updating cost:", err);
    return NextResponse.json({ success: false, message: err.message });
  }
}

export async function DELETE(req: Request, context: any) {
  
    const { tenantId } = await withTenantGuard(req);
try {
    await connectToDatabase();

    const { id } = context.params;
    const deleted = await Miscellaneous.findOneAndDelete({ _id: id, tenantId });

    if (!deleted)
      return NextResponse.json({ success: false, message: "Cost not found" });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof TenantGuardError) return err.response;
    console.error("❌ Error deleting cost:", err);
    return NextResponse.json({ success: false, message: err.message });
  }
}
