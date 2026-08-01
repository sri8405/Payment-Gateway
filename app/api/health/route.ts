import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "disconnected";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await connectToDatabase();
    if (mongoose.connection.readyState === 1) {
      dbStatus = "connected";
      await mongoose.connection.db?.admin().ping();
      dbLatencyMs = Date.now() - dbStart;
    }
  } catch (error: any) {
    dbStatus = `error: ${error.message || "connection failed"}`;
  }

  const envStatus = {
    mongodb: !!process.env.MONGODB_URI,
    razorpayKeyId: !!process.env.RAZORPAY_KEY_ID,
    razorpaySecret: !!process.env.RAZORPAY_KEY_SECRET,
    resendApiKey: !!process.env.RESEND_API_KEY,
    nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
  };

  const memUsage = process.memoryUsage ? process.memoryUsage() : null;
  const uptimeSec = process.uptime ? Math.floor(process.uptime()) : 0;

  const isHealthy = dbStatus === "connected" && envStatus.mongodb && envStatus.razorpayKeyId;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      process: {
        uptimeSeconds: uptimeSec,
        nodeVersion: process.version,
        memoryUsage: memUsage ? {
          rssMb: Math.round(memUsage.rss / 1024 / 1024),
          heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024),
          heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
        } : null,
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      environment: envStatus,
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    },
    { status: isHealthy ? 200 : 503 }
  );
}
