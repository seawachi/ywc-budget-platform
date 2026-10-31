import { NextRequest, NextResponse } from "next/server";
import { extractReceiptWithGemini, simulateOcrFallback } from "@/lib/gemini";

const ALLOWED_STORAGE_HOSTS = [
  "ywc-budget-platform.vercel.app",
  "knjufluvpzrtzfhxhyux.supabase.co",
  "localhost",
  "127.0.0.1",
];

function isAllowedHost(hostname: string): boolean {
  if (ALLOWED_STORAGE_HOSTS.includes(hostname)) return true;
  if (hostname.endsWith(".supabase.co")) return true;
  if (hostname.endsWith(".vercel.app")) return true;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType, sampleType } = body;

    // Detect if this is explicitly requested as one of the demo samples
    if (sampleType) {
      const simulated = simulateOcrFallback(sampleType);
      return NextResponse.json(simulated);
    }

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 }
      );
    }

    let cleanBase64 = imageBase64;

    // SSRF Guard: If it's a remote URL, validate hostname strictly against allowed storage hosts
    if (imageBase64.startsWith("http://") || imageBase64.startsWith("https://")) {
      try {
        const parsedUrl = new URL(imageBase64);
        if (!isAllowedHost(parsedUrl.hostname)) {
          return NextResponse.json(
            { error: "Remote image host not permitted for OCR processing" },
            { status: 403 }
          );
        }

        const imageRes = await fetch(imageBase64);
        if (imageRes.ok) {
          const arrayBuffer = await imageRes.arrayBuffer();
          cleanBase64 = Buffer.from(arrayBuffer).toString("base64");
        } else {
          return NextResponse.json(
            { error: "Failed to download receipt image from storage" },
            { status: 400 }
          );
        }
      } catch (urlErr) {
        return NextResponse.json(
          { error: "Invalid image URL provided" },
          { status: 400 }
        );
      }
    }

    // Process image through Gemini OCR
    const data = await extractReceiptWithGemini(cleanBase64, mimeType || "image/jpeg");
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API /api/ocr error:", error);
    return NextResponse.json(
      {
        error: "OCR extraction failed. Please enter receipt details manually.",
        details: error?.message || "Internal OCR processing error",
      },
      { status: 500 }
    );
  }
}
