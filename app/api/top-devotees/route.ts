import { NextResponse } from "next/server";
import { donationRepository } from "@/lib/db/repositories/donationRepository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const devotees = await donationRepository.findTopDonors(500, 50);
    return NextResponse.json(
      { devotees },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Pragma": "no-cache"
        }
      }
    );
  } catch (error: any) {
    console.error("Top Devotees API Error:", error);
    return NextResponse.json({ devotees: [] }, { status: 500 });
  }
}

