// app/api/test/route.ts
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ status: "✅ MongoDB connected successfully" });
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    return NextResponse.json({ status: "❌ MongoDB connection failed" }, { status: 500 });
  }
}
