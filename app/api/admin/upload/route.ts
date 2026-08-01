import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth"; // ensure admin check

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Limit maximum file size (5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate Magic Bytes (File Signatures) for Images to prevent executable content
    const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp = buffer.length >= 12 && buffer.toString('ascii', 8, 12) === 'WEBP';
    const isGif = buffer.length >= 6 && (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a');

    if (!isJpeg && !isPng && !isWebp && !isGif) {
      return NextResponse.json({ error: "Invalid image format. Only JPEG, PNG, WEBP, and GIF files are allowed." }, { status: 400 });
    }

    // Determine strict extension based on validated magic bytes
    let safeExt = ".jpg";
    if (isPng) safeExt = ".png";
    if (isWebp) safeExt = ".webp";
    if (isGif) safeExt = ".gif";

    // Create a safe unique filename with enforced image extension
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `img-${uniqueSuffix}${safeExt}`;
    
    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Ignore if exists
    }

    const path = join(uploadsDir, filename);
    await writeFile(path, buffer);

    const publicUrl = `/uploads/${filename}`;
    
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
