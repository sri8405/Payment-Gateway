import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { auditLogRepository } from "@/lib/db/repositories/auditLogRepository";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";
import { sevaSchema } from "@/lib/validations/seva";
import { apiErrorResponse, AppError } from "@/lib/utils/errors";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: Params) {
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

    const { id } = await params;
    const before = await sevaRepository.findById(id);
    const seva = await sevaRepository.update(id, {
      name: parsed.data.name,
      description: parsed.data.description || undefined,
      suggestedAmount: parsed.data.suggestedAmount,
      active: parsed.data.active
    });

    await auditLogRepository.create({
      adminId,
      action: "UPDATE",
      collection: "Seva",
      recordId: seva._id,
      oldValues: before,
      newValues: seva
    });

    return Response.json({ seva });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    const adminId = session?.user?.id;

    if (!adminId) {
      throw new AppError("UNAUTHORIZED", "Unauthorized");
    }

    const { id } = await params;
    const before = await sevaRepository.findById(id);
    const seva = await sevaRepository.delete(id);

    await auditLogRepository.create({
      adminId,
      action: "DELETE",
      collection: "Seva",
      recordId: id,
      oldValues: before,
      newValues: null
    });

    return Response.json({ seva });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
