import { auth } from "@/lib/auth";
import { auditLogRepository } from "@/lib/db/repositories/auditLogRepository";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";
import { templeSettingsSchema } from "@/lib/validations/templeSettings";
import { apiErrorResponse, AppError } from "@/lib/utils/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "Unauthorized");
    }

    const settings = await templeSettingsRepository.getCurrentOrDefault();
    return Response.json({ settings });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    const adminId = session?.user?.id;
    if (!adminId) {
      throw new AppError("UNAUTHORIZED", "Unauthorized");
    }

    const body = await request.json();
    const parsed = templeSettingsSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("BAD_REQUEST", parsed.error.issues[0]?.message || "Invalid temple settings");
    }

    const before = await templeSettingsRepository.getCurrent();
    const settings = await templeSettingsRepository.upsertCurrent({
      templeName: parsed.data.templeName,
      templeDescription: parsed.data.templeDescription || undefined,
      upiId: parsed.data.upiId,
      upiDisplayName: parsed.data.upiDisplayName,
      contactNumber: parsed.data.contactNumber || undefined,
      email: parsed.data.email || undefined,
      address: parsed.data.address || undefined,
      logoUrl: parsed.data.logoUrl || undefined,
      receiptFooter: parsed.data.receiptFooter || undefined
    });

    await auditLogRepository.create({
      adminId,
      action: "UPDATE",
      collection: "TempleSettings",
      recordId: settings._id,
      oldValues: before,
      newValues: settings
    });

    return Response.json({ settings });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
