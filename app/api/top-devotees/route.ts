import { NextResponse } from "next/server";
import { donationRepository } from "@/lib/db/repositories/donationRepository";

export async function GET() {
  try {
    const devotees = await donationRepository.findTopDonors(500, 50);
    return NextResponse.json(
      { devotees },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=120"
        }
      }
    );
  } catch (error: any) {
    console.error("Top Devotees API Error:", error);
    return NextResponse.json({ devotees: [] }, { status: 500 });
  }
}
