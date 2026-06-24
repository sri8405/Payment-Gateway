import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { auditLogRepository } from "@/lib/db/repositories/auditLogRepository";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";
import { sevaSchema } from "@/lib/validations/seva";
import { apiErrorResponse, AppError } from "@/lib/utils/errors";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "Unauthorized");
    }

    const sevas = await sevaRepository.findAll();
    return Response.json({ sevas });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const adminId = session?.user?.id;

    if (!adminId) {
      throw new AppError("UNAUTHORIZED", "Unauthorized");
    }

    const body = await request.json();
    const parsed = sevaSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("BAD_REQUEST", parsed.error.issues[0]?.message || "Invalid seva");
    }

    const seva = await sevaRepository.create({
      name: parsed.data.name,
      description: parsed.data.description || undefined,
      suggestedAmount: parsed.data.suggestedAmount,
      active: parsed.data.active,
      isSystem: false
    });

    await auditLogRepository.create({
      adminId,
      action: "CREATE",
      collection: "Seva",
      recordId: seva._id,
      oldValues: null,
      newValues: seva
    });

    return Response.json({ seva }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
