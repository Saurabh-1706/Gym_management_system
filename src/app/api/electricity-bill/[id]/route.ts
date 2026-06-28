// app/api/electricity/[id]/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ElectricityBill from "@/models/ElectricityBill";
import { withTenantGuard, TenantGuardError } from "@/lib/tenantGuard";


export async function PUT(req: Request,
  context: any) {
  
    const { tenantId } = await withTenantGuard(req);
const { id } = await context.params;

  try {
    await connectToDatabase();

    const { id } = await context.params; // 🔹 must await params
    const body = await req.json();
    const { month, year, amount } = body;

    if (!month || !year || !amount) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    const updated = await ElectricityBill.findOneAndUpdate(
      { _id: id, tenantId },
      { month, year, amount },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, bill: updated });
  } catch (error) {
    if (error instanceof TenantGuardError) return error.response;
    console.error("❌ Update bill error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update bill" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  
    const { tenantId } = await withTenantGuard(req);
try {
    await connectToDatabase();

    const { id } = await context.params;

    const deleted = await ElectricityBill.findOneAndDelete({ _id: id, tenantId });

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bill deleted successfully",
    });
  } catch (error) {
    if (error instanceof TenantGuardError) return error.response;
    console.error("❌ Delete bill error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete bill" },
      { status: 500 }
    );
  }
}
