import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length > 0) {
    const firstSegment = segments[0];

    // Skip API, NextAuth, onboarding, assets, static files, and login/auth paths
    const excludedPrefixes = ["api", "auth", "onboarding", "not-found", "_next", "favicon.ico", "logo-removebg-preview.png", "screenshots", "images", "Layer 0 Frame.png"];
    if (!excludedPrefixes.includes(firstSegment) && !firstSegment.includes(".")) {
      const slug = firstSegment;

      try {
        // Call our internal API route to check if the tenant exists
        const res = await fetch(`${req.nextUrl.origin}/api/tenant?slug=${slug}`);
        
        if (!res.ok) {
          return NextResponse.next();
        }

        const data = await res.json();

        if (!data.success || !data.exists) {
          // If tenant doesn't exist, redirect to /not-found
          return NextResponse.redirect(new URL("/not-found", req.url));
        }

        // If user accesses the tenant root (e.g. /[tenantSlug]), redirect to dashboard
        if (segments.length === 1) {
          return NextResponse.redirect(new URL(`/${slug}/dashboard`, req.url));
        }

        // Clone headers and inject x-tenant-id
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set("x-tenant-id", data.tenantId);

        // Continue with injected headers
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } catch (err) {
        console.error("Middleware tenant check error:", err);
      }
    }
  }

  return NextResponse.next();
}

// Configure routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
