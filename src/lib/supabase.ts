import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadReceiptFile(
  file: File | Blob,
  fileName: string
): Promise<{ url: string; error?: string }> {
  // If no real Supabase configured or in demo mode, return mock or local data URI
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("example.supabase.co") ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy.supabase.co")
  ) {
    // Generate object URL or return sample receipt fallback
    return {
      url: `/sample-receipts/${fileName.endsWith(".jpg") ? fileName : "makro-mixed-bill.svg"}`,
    };
  }

  try {
    const filePath = `receipts/${Date.now()}-${fileName}`;
    const { error } = await supabase.storage
      .from("receipts")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return { url: "", error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl };
  } catch (err) {
    console.error("Unexpected upload error:", err);
    return { url: "", error: String(err) };
  }
}
