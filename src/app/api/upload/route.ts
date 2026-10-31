import { NextRequest, NextResponse } from "next/server";
import { uploadReceiptToS3 } from "@/lib/s3-storage";
import { getCurrentUser } from "@/actions/user.actions";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/svg+xml",
  "application/pdf",
];

export async function POST(req: NextRequest) {
  try {
    // 1. Session verification
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 2. File size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ไฟล์มีขนาดใหญ่เกิน 10MB กรุณาย่อขนาดไฟล์ก่อนอัปโหลด" },
        { status: 413 }
      );
    }

    // 3. MIME type validation
    const contentType = file.type || "image/jpeg";
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP) หรือเอกสาร PDF เท่านั้น" },
        { status: 415 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadReceiptToS3({
      fileBuffer: buffer,
      fileName: file.name,
      contentType,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      url: result.url,
      storage: result.storage,
      key: result.key,
    });
  } catch (error) {
    console.error("API /api/upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: String(error) },
      { status: 500 }
    );
  }
}
