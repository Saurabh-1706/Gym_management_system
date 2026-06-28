import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Tenant from "@/models/Tenant";
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export class TenantGuardError extends Error {
  response: NextResponse;
  constructor(message: string, status: number) {
    super(message);
    this.response = NextResponse.json({ error: message }, { status });
  }
}

export async function withTenantGuard(req: Request) {
  await connectToDatabase();
  
  // In Next.js App Router, getServerSession requires authOptions
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    throw new TenantGuardError("No tenant context", 401);
  }

  const tenant = await Tenant.findById(session.user.tenantId).exec();
  if (!tenant) {
    throw new TenantGuardError("Tenant not found", 404);
  }

  if (!tenant.isActive) {
    throw new TenantGuardError("Tenant account is inactive", 403);
  }

  return {
    tenantId: session.user.tenantId,
    tenant,
  };
}
