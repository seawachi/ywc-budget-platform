import { z } from "zod";

export const ClaimItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "ชื่อรายการต้องไม่ว่างเปล่า"),
  quantity: z.number().int().min(1, "จำนวนต้องอย่างน้อย 1"),
  unitPrice: z.number().min(0, "ราคาต่อหน่วยต้องไม่ติดลบ"),
  totalPrice: z.number().min(0, "ราคารวมต้องไม่ติดลบ"),
  isClaimed: z.boolean().default(true),
});

export const CreateClaimSchema = z.object({
  title: z.string().min(2, "หัวข้อการเบิกต้องมีความยาวอย่างน้อย 2 ตัวอักษร").max(150, "หัวข้อการเบิกยาวเกินไป"),
  departmentId: z.string().min(1, "กรุณาเลือกฝ่าย"),
  amount: z.number().positive("ยอดเงินขอเบิกต้องมากกว่า 0"),
  receiptTotal: z.number().nonnegative().nullable().optional(),
  receiptImageUrl: z.string().min(1, "กรุณาแนบรูปภาพใบเสร็จ"),
  docType: z.enum(["BANK_SLIP", "CASH_RECEIPT", "TAX_INVOICE", "OTHER"]).default("CASH_RECEIPT"),
  promptpayId: z.string().min(8, "หมายเลข PromptPay ไม่ถูกต้อง").max(15, "หมายเลข PromptPay ไม่ถูกต้อง"),
  items: z.array(ClaimItemSchema).min(1, "ต้องมีรายการในบิลอย่างน้อย 1 รายการ"),
});

export const ApproveClaimSchema = z.object({
  claimId: z.string().min(1, "claimId is required"),
});

export const RejectClaimSchema = z.object({
  claimId: z.string().min(1, "claimId is required"),
  reason: z.string().min(2, "กรุณาระบุเหตุผลการปฏิเสธอย่างน้อย 2 ตัวอักษร").max(500),
});

export const MarkPaidSchema = z.object({
  claimId: z.string().min(1, "claimId is required"),
  payoutSlipUrl: z.string().optional(),
});

export const RegisterUserSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  promptpayId: z.string().optional(),
  role: z.enum(["STAFF", "TREASURER"]).default("STAFF"),
});

export const LoginUserSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});
