import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-9xl font-headline text-[#f97316]/20">404</h1>
        <h2 className="text-3xl font-bold text-[#e5e2e1]">Gym Not Found</h2>
        <p className="text-zinc-400 max-w-md mx-auto">
          The gym or portal you are looking for does not exist or has been deactivated.
        </p>
        <Link
          href="/"
          className="inline-block mt-8 bg-[#f97316] text-white font-semibold py-3 px-8 rounded-lg hover:bg-[#ea580c] transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
