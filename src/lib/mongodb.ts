import mongoose from "mongoose";

let cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectToDatabase() {
  // ✅ Only check the env var *when* we actually connect
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("❌ MONGODB_URI is not defined. Please set it in environment variables.");
  }

  if (cached.conn) {
    // ✅ Reuse existing connection
    console.log("✅ Using existing MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("🔗 Connecting to MongoDB...");
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: "gymapp",
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  console.log("✅ MongoDB connected successfully");
  return cached.conn;
}
