import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === "super_admin") {
    redirect("/super-admin/dashboard");
  }

  if (session?.user?.tenantSlug) {
    redirect(`/${session.user.tenantSlug}/dashboard`);
  }

  redirect("/auth");
}
