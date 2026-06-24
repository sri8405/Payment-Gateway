import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { apiErrorResponse } from "@/lib/utils/errors";

export async function GET() {
  try {
    await connectToDatabase();
    await mongoose.connection.db?.admin().ping();

    return Response.json({
      success: true,
      message: "MongoDB Connected Successfully"
    });
  } catch (error) {
    console.error("MongoDB test endpoint failed:", error);
    return apiErrorResponse(error);
  }
}
