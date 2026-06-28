import React from "react";
import Tenant from "@/models/Tenant";
import { connectToDatabase } from "@/lib/mongodb";
import { notFound } from "next/navigation";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  
  await connectToDatabase();
  const tenant = await Tenant.findOne({ slug: tenantSlug }).lean();
  
  if (!tenant) {
    notFound();
  }

  const primaryColor = (tenant as any).primaryColor || "#F97316";

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `:root {
          --accent: ${primaryColor};
          --color-accent: ${primaryColor};
          --primary: ${primaryColor};
          --color-primary: ${primaryColor};
          --ring: ${primaryColor};
          --color-ring: ${primaryColor};
        }`
      }} />
      {children}
    </>
  );
}
