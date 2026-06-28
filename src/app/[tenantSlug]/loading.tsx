import GymLoader from "@/components/ui/GymLoader";

// This file is the App Router loading UI for all [tenantSlug] pages.
// It automatically shows during route transitions and initial page loads.
export default function Loading() {
  return <GymLoader message="Loading..." />;
}
