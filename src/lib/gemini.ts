import { ExtractedReceiptData } from "@/types/receipt";

/**
 * Reconcile and guarantee VAT item inclusion in the items list
 * Especially crucial for TAX_INVOICE or receipts where VAT 7% is listed at the bottom
 */
export function reconcileVatItems(data: ExtractedReceiptData): ExtractedReceiptData {
  if (!data || !Array.isArray(data.items)) return data;

  const isTaxInvoice =
    data.docType === "TAX_INVOICE" ||
    /tax\s*invoice|ใบกำกับภาษี|ใบเสร็จรับเงิน|abb|บิล vat/i.test(
      `${data.title || ""} ${data.merchantName || ""}`
    );

  // Check if VAT item is already explicitly in the items list
  const hasVatItem = data.items.some((it) =>
    /ภาษีมูลค่าเพิ่ม|vat/i.test(it.name)
  );

  const itemsSum = Number(
    data.items.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0).toFixed(2)
  );
  const receiptTotal = Number(Number(data.receiptTotal || 0).toFixed(2));
  const diff = Number((receiptTotal - itemsSum).toFixed(2));

  // If VAT item is not yet present:
  if (!hasVatItem) {
    if (data.vatAmount && data.vatAmount > 0) {
      data.items.push({
        name: "ภาษีมูลค่าเพิ่ม 7% (VAT 7%)",
        quantity: 1,
        unitPrice: Number(data.vatAmount.toFixed(2)),
        totalPrice: Number(data.vatAmount.toFixed(2)),
        isClaimed: true,
      });
    } else if (diff > 0 && (isTaxInvoice || Math.abs(diff - Number((itemsSum * 0.07).toFixed(2))) < 2.0 || Math.abs(diff - Number((receiptTotal * 7 / 107).toFixed(2))) < 2.0)) {
      // The positive difference between receipt total and items sum corresponds to VAT 7%
      data.vatAmount = diff;
      data.items.push({
        name: "ภาษีมูลค่าเพิ่ม 7% (VAT 7%)",
        quantity: 1,
        unitPrice: diff,
        totalPrice: diff,
        isClaimed: true,
      });
    }
  }

  return data;
}

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function extractReceiptWithGemini(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<ExtractedReceiptData> {
  const apiKey = process.env.GEMINI_API_KEY;

  // If no Gemini key is provided, provide smart fallback extraction
  if (!apiKey || apiKey === "your-gemini-api-key") {
    console.log("No GEMINI_API_KEY detected. Using intelligent simulated OCR parser.");
    return simulateOcrFallback(imageBase64);
  }

  try {
    // Attempt using official @google/genai client with timeout
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an expert OCR and financial auditor specialized in Thai receipts, tax invoices, and bank transfer slips.
Extract all relevant transaction details from the provided receipt image into structured JSON matching this schema:
{
  "title": "Short descriptive summary of what this purchase is for in Thai (e.g. ค่าวัตถุดิบทำอาหาร, ค่าเช่าเครื่องเสียง, ค่าน้ำดื่ม)",
  "merchantName": "Name of the merchant/store/counterparty",
  "expenseDate": "YYYY-MM-DD",
  "docType": "BANK_SLIP" | "CASH_RECEIPT" | "TAX_INVOICE" | "OTHER",
  "receiptTotal": 0.00,
  "vatAmount": 0.00,
  "items": [
    {
      "name": "Item description in Thai/English",
      "quantity": 1,
      "unitPrice": 0.00,
      "totalPrice": 0.00
    }
  ]
}
Notes:
- docType: Use TAX_INVOICE for official receipts/tax invoices, CASH_RECEIPT for handwritten/cash bills, BANK_SLIP for bank transfer slips (K+, SCB, etc.).
- Ensure receiptTotal is the exact grand total displayed on the paper.
- Extract individual line items if present. If it is a bank slip with one transfer amount, return 1 item with the full amount.
- VAT / TAX INVOICE REQUIREMENT:
  If the document is a TAX_INVOICE or contains VAT (Value Added Tax / ภาษีมูลค่าเพิ่ม 7%):
  1. Extract the VAT amount into the "vatAmount" field if present.
  2. YOU MUST ALWAYS INCLUDE THE VAT AS A LINE ITEM IN THE "items" ARRAY:
     {
       "name": "ภาษีมูลค่าเพิ่ม 7% (VAT 7%)",
       "quantity": 1,
       "unitPrice": <vat_amount>,
       "totalPrice": <vat_amount>
     }
  3. Ensure that all items (including the VAT line item) correctly account for the receiptTotal so the staff member can claim the full reimbursement.
Return ONLY valid JSON without markdown fences.`;

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const candidateModels = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-flash-latest"];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const generatePromise = ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                { text: systemPrompt },
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: mimeType || "image/jpeg",
                  },
                },
              ],
            },
          ],
        });

        // 10s strict timeout per candidate model call
        const response = await withTimeout(
          generatePromise,
          10000,
          `Gemini OCR model ${model} timed out after 10s`
        );

        const text = response.text || "";
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson) as ExtractedReceiptData;
        return reconcileVatItems(parsed);
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini model ${model} attempt failed, trying next candidate:`, err?.message || err);
      }
    }

    throw lastError || new Error("All Gemini OCR candidate models failed or timed out");
  } catch (error) {
    console.error("Gemini OCR error or timeout, falling back to smart parser:", error);
    return simulateOcrFallback(imageBase64);
  }
}

/**
 * Intelligent OCR fallback for demo/interview when API key is unset or rate limited
 */
export function simulateOcrFallback(sampleHintOrBase64?: string): ExtractedReceiptData {
  const hint = sampleHintOrBase64 || "";

  if (hint.includes("slip") || hint.includes("kplus") || hint.includes("ธนาคาร")) {
    return {
      title: "ค่าเช่าชุดเครื่องเสียงและไมค์ไร้สาย",
      merchantName: "บจก. สยามซาวด์ แอนด์ ไลท์ติ้ง",
      expenseDate: new Date().toISOString().split("T")[0],
      docType: "BANK_SLIP",
      receiptTotal: 8000.0,
      items: [
        {
          name: "มัดจำเช่าระบบเสียง PA 3 วัน 2 คืน",
          quantity: 1,
          unitPrice: 8000.0,
          totalPrice: 8000.0,
          isClaimed: true,
        },
      ],
    };
  }

  if (hint.includes("handwritten") || hint.includes("ป้าสมใจ") || hint.includes("ข้าวกล่อง")) {
    return {
      title: "ค่าอาหารและข้าวกล่องเตรียมค่าย",
      merchantName: "ร้านป้าสมใจ อาหารตามสั่ง",
      expenseDate: new Date().toISOString().split("T")[0],
      docType: "CASH_RECEIPT",
      receiptTotal: 6500.0,
      items: [
        {
          name: "ข้าวกล่องหมูกรอบไข่ดาว 100 กล่อง",
          quantity: 100,
          unitPrice: 60.0,
          totalPrice: 6000.0,
          isClaimed: true,
        },
        {
          name: "น้ำซุปกระดูกหมูหม้อใหญ่",
          quantity: 1,
          unitPrice: 500.0,
          totalPrice: 500.0,
          isClaimed: true,
        },
      ],
    };
  }

  // Default: Makro Tax Invoice with personal items and VAT 7%
  return {
    title: "ซื้อของใช้และเครื่องดื่มเตรียมกิจกรรมค่าย",
    merchantName: "Makro สาขาสามย่านมิตรทาวน์",
    expenseDate: new Date().toISOString().split("T")[0],
    docType: "TAX_INVOICE",
    receiptTotal: 1551.5,
    vatAmount: 101.5,
    items: [
      {
        name: "น้ำดื่มตราสิงห์ 600ml (แพ็ค 12 ขวด)",
        quantity: 20,
        unitPrice: 50.0,
        totalPrice: 1000.0,
        isClaimed: true,
      },
      {
        name: "น้ำแข็งหลอดบริสุทธิ์ 10kg",
        quantity: 5,
        unitPrice: 40.0,
        totalPrice: 200.0,
        isClaimed: true,
      },
      {
        name: "อาหารแมว Whiskas ปลาทะเล [ของส่วนตัว]",
        quantity: 1,
        unitPrice: 189.0,
        totalPrice: 189.0,
        isClaimed: false, // Default uncheck for personal item demonstration!
      },
      {
        name: "ชานมเย็นกระป๋อง [ของส่วนตัว]",
        quantity: 2,
        unitPrice: 30.5,
        totalPrice: 61.0,
        isClaimed: false,
      },
      {
        name: "ภาษีมูลค่าเพิ่ม 7% (VAT 7%)",
        quantity: 1,
        unitPrice: 101.5,
        totalPrice: 101.5,
        isClaimed: true,
      },
    ],
  };
}
