import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { donationRepository, type DonationStatus } from "@/lib/db/repositories/donationRepository";
import { apiErrorResponse, AppError } from "@/lib/utils/errors";

function dateFromParam(value: string | null, endOfDay = false) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      throw new AppError("UNAUTHORIZED", "Unauthorized");
    }

    const params = request.nextUrl.searchParams;
    const status = params.get("status");
    const data = await donationRepository.findAll({
      search: params.get("search") || undefined,
      from: dateFromParam(params.get("from")),
      to: dateFromParam(params.get("to"), true),
      sevaId: params.get("sevaId") || undefined,
      status: status === "PENDING" || status === "VERIFIED" ? (status as DonationStatus) : undefined,
      page: Number(params.get("page") || 1),
      limit: Number(params.get("limit") || 20)
    });

    return Response.json(data);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
