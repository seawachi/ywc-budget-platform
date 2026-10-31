# 💰 Camp & Club Budget Tracker — Project Specification & User Flows

เว็บแอปพลิเคชันสำหรับบริหารจัดการงบประมาณและระบบเบิกจ่ายเงิน (Reimbursement) สำหรับค่ายและชมรมในมหาวิทยาลัย แก้ปัญหาการส่งบิลผ่าน Google Forms ที่ซ้ำซ้อน การตรวจเอกสารที่ล่าช้า และความเสี่ยงเรื่องงบบานปลาย ด้วย **AI Receipt Scanner (Editable Line-Items)** และระบบ **Instant PromptPay QR Payout**

---

## 🛠 1. Tech Stack & Architecture

* **Framework:** Next.js 15 (App Router, TypeScript, Server Actions)
* **Styling & UI:** Tailwind CSS, `shadcn/ui`, `lucide-react`
* **Database & Auth:** Supabase (PostgreSQL + Supabase Auth)
* **File Storage:** Supabase Storage (Public Bucket: `receipts`)
* **ORM:** Prisma ORM
* **AI Engine:** `@google/genai` (`gemini-2.5-flash` สำหรับ Multimodal Receipt OCR + Structured JSON Output)
* **Payment Utility:** `promptpay-qr` + `qrcode.react` (สร้าง EMVCo QR Code ล็อกยอดเงินโอนคืน)
* **Deployment:** Vercel

---

## ✨ 2. Complete Feature Breakdown

### 🔐 2.1 Authentication & Interview Demo Mode
* **Supabase Auth:** รองรับการเข้าสู่ระบบด้วย Email/Password หรือ Google OAuth พร้อมผูกข้อมูลเบอร์ PromptPay ประจำตัวผู้ใช้
* **One-Click Demo Bypass:** ปุ่มสำหรับกรรมการสัมภาษณ์ กดเข้าใช้งานได้ทันทีโดยไม่ต้องสมัครสมาชิก
* **Live Role Switcher:** แถบสลับบทบาทบน Navbar (`👤 Staff ผู้เบิก` ↔️ `⚖️ Treasurer เหรัญญิก`) เพื่อทดสอบ Flow ทั้งสองฝั่งได้ในหน้าจอเดียว

### 📊 2.2 Real-Time Budget Dashboard (Shared View)
* **4 Summary Metric Cards:**
  1. `Total Allocated Budget` (งบประมาณรวมทั้งค่าย)
  2. `Actual Disbursed` (ยอดที่โอนคืนสำเร็จแล้ว - สถานะ `PAID`)
  3. `Pending / Reserved` (ยอดที่กำลังรออนุมัติหรือรอโอน - สถานะ `PENDING` + `APPROVED`)
  4. `Available Balance` (งบคงเหลือที่ใช้ได้จริง = งบรวม - โอนแล้ว - รอดำเนินการ)
* **Department Budget Bars:** หลอดแสดงความคืบหน้าการใช้งบแยกตามฝ่าย (เช่น ฝ่ายกิจกรรม, ฝ่ายสวัสดิการ, ฝ่ายพัสดุ, ฝ่ายสถานที่) เปลี่ยนสีอัตโนมัติ (เขียว < 75%, เหลือง 75–90%, แดง > 90%)

### 🤖 2.3 Smart AI Receipt Scanner & Editable Line-Item List (Staff Side)
* **Drag & Drop + Sample Receipt Selector:** อัปโหลดรูปบิลจากเครื่อง หรือกดเลือกจาก "บิลตัวอย่าง" 3 รูปแบบ (สลิปโอนเงิน, บิลเงินสดเขียนมือ, ใบเสร็จ Makro/7-Eleven ที่มีหลายรายการ)
* **Gemini Line-Item Extraction:** สกัดข้อมูลหัวบิล (ชื่อร้าน, วันที่, ประเภทเอกสาร, ยอดรวมท้ายบิล) และรายการสินค้าทุกบรรทัด (`name`, `quantity`, `unitPrice`, `totalPrice`)
* **Interactive Editable Table (จุดเด่นหลัก):**
  * **Checkbox Selection:** ติ๊กออกเพื่อตัดรายการ "ของใช้ส่วนตัว" ที่ปนมาในบิลเดียวกันออกจากการเบิกค่าย
  * **Inline Editing:** แก้ไขชื่อรายการ จำนวน และราคาต่อหน่วยได้โดยตรงหาก AI อ่านเพี้ยน
  * **Add / Delete Row:** เพิ่มรายการที่ตกหล่น หรือลบรายการที่ไม่เกี่ยวข้อง
  * **Discrepancy Warning Badge:** เทียบผลรวมของรายการทั้งหมดกับ `ยอดสุทธิท้ายบิล` ที่ AI อ่านได้ หากตัวเลขไม่ตรงกันจะขึ้นป้ายเตือนให้ตรวจสอบก่อนกดส่ง

### ⚖️ 2.4 Split-Screen Verification & Instant PromptPay Payout (Treasurer Side)
* **Filterable Claims Queue:** ตารางรายการเบิกทั้งหมด กรองตามสถานะ (`PENDING`, `APPROVED`, `PAID`, `REJECTED`) และกรองตามฝ่ายได้
* **Split-Screen Inspection Modal:**
  * **ฝั่งซ้าย:** รูปใบเสร็จต้นฉบับ (ซูมดูรายละเอียดได้) + ป้ายระบุประเภทเอกสาร (`BANK_SLIP`, `CASH_RECEIPT`, `TAX_INVOICE`)
  * **ฝั่งขวา:** ตารางรายการสินค้าที่สต๊าฟเลือกเบิก + ยอดรวมสุทธิ + ปุ่ม `Approve` หรือ `Reject (พร้อมระบุเหตุผล)`
* **Dynamic PromptPay QR Generator:** เมื่อบิลได้รับการอนุมัติ ระบบจะสร้าง QR Code พร้อมเพย์จากเบอร์โทรผู้เบิกและล็อกยอดเงินตามบิล เหรัญญิกสแกนจ่ายผ่านแอปธนาคารได้ทันที
* **Payout Slip Attachment:** อัปโหลดหลักฐานการโอนคืน (หรือกดยืนยันการโอน) เพื่อเปลี่ยนสถานะเป็น `PAID` และตัดงบประมาณจริง

---

## 🔄 3. User Flows (แยกตามบทบาทผู้ใช้งาน)

### 👤 Side A: Staff (สต๊าฟผู้สำรองจ่ายและขอเบิกเงิน)

```text
[เข้าหน้า Dashboard] 
   │
   ▼
1. เช็กงบคงเหลือของฝ่ายตัวเองจาก Progress Bar (ป้องกันการซื้อเกินงบ)
   │
   ▼
2. กดปุ่ม "+ ส่งบิลเบิกเงิน (New Claim)"
   │
   ▼
3. อัปโหลดรูปใบเสร็จ หรือ กดปุ่ม "ลองใช้บิลตัวอย่าง (Sample Receipt)"
   │
   ▼
4. ระบบเรียก API (/api/ocr) -> Gemini 2.5 Flash สกัดหัวบิล + รายการย่อย (Line Items)
   │
   ▼
5. หน้าจอแสดง "Editable Receipt Items Table"
   ├── ติ๊ก Checkbox ออก ในแถวที่เป็นของส่วนตัว (เช่น ซื้อขนมส่วนตัวปนมาในบิลค่าย)
   ├── แก้ไขชื่อสินค้า / จำนวน / ราคา หาก AI อ่านลายมือผิด
   └── ระบบคำนวณ "ยอดขอเบิกสุทธิ (Claimable Amount)" ใหม่แบบ Real-time
   │
   ▼
6. เลือก "ฝ่ายที่เบิก (Department)" และตรวจสอบเบอร์ PromptPay รับเงินคืน
   │
   ▼
7. กด "ยืนยันส่งเบิก (Submit Claim)" -> สถานะเป็น [PENDING] (งบถูกกันไว้ในช่อง Reserved)
   │
   ▼
8. ติดตามสถานะบิลในหน้า My Claims: [PENDING] ➔ [APPROVED] ➔ [PAID] (กดดูสลิปโอนคืนได้)
```

---

### ⚖️ Side B: Treasurer (เหรัญญิก / ผู้ตรวจและโอนเงิน)

```text
[เข้าหน้า Treasury Queue (หรือกดสลับ Role Switcher เป็น Treasurer)]
   │
   ▼
1. ดูรายการที่อยู่ในคิว [PENDING] (เรียงตามวันที่ส่ง)
   │
   ▼
2. กดปุ่ม "ตรวจสอบบิล (Review)" -> เปิด Split-Screen Modal
   ├── ฝั่งซ้าย: ดูรูปบิลจริง + เช็กว่าเป็นสลิปโอนเงินหรือใบกำกับภาษีครบตามกฎไหม
   └── ฝั่งขวา: ดูรายการย่อยที่สต๊าฟติ๊กเบิกมา เทียบกับรูปฝั่งซ้าย
   │
   ├──► กรณีเอกสารไม่ผ่าน/ยอดผิด: กด [Reject] -> พิมพ์เหตุผล (เช่น "แนบมาแค่สลิป รบกวนถ่ายรูปบิลเงินสดมาเพิ่ม") -> จบ Flow
   │
   ▼ (กรณีเอกสารถูกต้อง)
3. กดปุ่ม [Approve & Pay] -> สถานะเปลี่ยนเป็น [APPROVED]
   │
   ▼
4. หน้าจอเด้ง "PromptPay QR Modal" (เจนจากเบอร์ผู้เบิก + ยอดเงินสุทธิที่อนุมัติ)
   │
   ▼
5. เหรัญญิกใช้มือถือสแกน QR จ่ายเงิน -> แนบรูปสลิปโอนคืน (หรือกดปุ่ม Quick Confirm สำหรับ Demo)
   │
   ▼
6. กดปุ่ม "Mark as Paid" -> สถานะเปลี่ยนเป็น [PAID] 
   └── งบใน Dashboard ย้ายจากช่อง Reserved ไปเป็น Actual Spent ทันที
```

---

### 🎯 Side C: Interviewer (กรรมการสัมภาษณ์ - 30-Second Evaluation Flow)

```text
[เปิด Live URL บน Vercel]
   │
   ▼
1. กดปุ่ม "🚀 Enter Interactive Demo Mode" (ไม่ต้องกรอกรหัสผ่าน)
   │
   ▼
2. เห็น Dashboard ที่มี Seed Data ของค่ายจำลองอยู่แล้ว (เห็นหลอดงบแต่ละฝ่ายและรายการเบิกตัวอย่าง)
   │
   ▼
3. กด "+ ส่งบิลเบิกเงิน" -> กดปุ่ม "🧾 ทดลองใช้บิล Makro ตัวอย่าง"
   │
   ▼
4. เห็น AI สกัดรายการออกมาเป็นตาราง -> ลองติ๊ก "อาหารแมว (ของส่วนตัว)" ออก -> เห็นยอดเงินลดลงทันที -> กด Submit
   │
   ▼
5. กดปุ่ม Role Switcher ด้านบนขวาเป็น "⚖️ Treasurer"
   │
   ▼
6. กดตรวจบิลที่เพิ่งสร้าง -> กด Approve -> เห็น PromptPay QR Code เด้งขึ้นมา -> กด Confirm Paid -> เห็นกราฟงบอัปเดตทันที
```

---

## 🗄 4. Database Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  STAFF
  TREASURER
}

enum ClaimStatus {
  PENDING
  APPROVED
  PAID
  REJECTED
}

enum DocType {
  BANK_SLIP
  CASH_RECEIPT
  TAX_INVOICE
  OTHER
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  role          Role      @default(STAFF)
  promptpayId   String?
  claims        Claim[]   @relation("SubmittedClaims")
  reviewed      Claim[]   @relation("ReviewedClaims")
  createdAt     DateTime  @default(now())
}

model Department {
  id              String   @id @default(uuid())
  name            String   // เช่น "ฝ่ายสวัสดิการ", "ฝ่ายพัสดุ", "ฝ่ายกิจกรรม", "ฝ่ายสถานที่"
  color           String   // Hex Color เช่น "#3B82F6"
  allocatedBudget Float
  claims          Claim[]
  createdAt       DateTime @default(now())
}

model Claim {
  id              String      @id @default(uuid())
  title           String
  merchantName    String?
  amount          Float       // ยอดที่ขอเบิกจริง (รวมเฉพาะ ClaimItem ที่ selected = true)
  receiptTotal    Float?      // ยอดรวมท้ายบิลที่ AI อ่านได้จากกระดาษ
  expenseDate     DateTime    @default(now())
  
  receiptImageUrl String
  docType         DocType     @default(CASH_RECEIPT)
  promptpayId     String
  
  status          ClaimStatus @default(PENDING)
  rejectReason    String?
  payoutSlipUrl   String?
  paidAt          DateTime?

  items           ClaimItem[]

  departmentId    String
  department      Department  @relation(fields: [departmentId], references: [id])
  
  submitterId     String
  submitter       User        @relation("SubmittedClaims", fields: [submitterId], references: [id])
  
  reviewerId      String?
  reviewer        User?       @relation("ReviewedClaims", fields: [reviewerId], references: [id])

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

model ClaimItem {
  id          String  @id @default(uuid())
  name        String
  quantity    Int     @default(1)
  unitPrice   Float
  totalPrice  Float
  isClaimed   Boolean @default(true) // true = เบิกค่าย, false = ของส่วนตัวที่ติ๊กออก

  claimId     String
  claim       Claim   @relation(fields: [claimId], references: [id], onDelete: Cascade)
}
```

---

## 📂 5. Full Directory Structure

```text
camp-budget-tracker/
├── prisma/
│   ├── schema.prisma                # โครงสร้างตาราง PostgreSQL
│   └── seed.ts                      # สคริปต์จำลองข้อมูล 4 ฝ่าย + บิลตัวอย่าง 5 รายการ
├── public/
│   └── sample-receipts/             # รูปใบเสร็จตัวอย่างสำหรับปุ่ม Quick Demo
│       ├── makro-mixed-bill.jpg     # บิลที่มีของค่ายปนกับของส่วนตัว
│       ├── kplus-slip.jpg           # สลิปโอนเงินทั่วไป
│       └── handwritten-bill.jpg     # บิลเงินสดเขียนมือ
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx         # หน้า Login + ปุ่ม Quick Demo Access
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx           # Layout หลัก มี Navbar + Role Switcher
│   │   │   ├── page.tsx             # หน้า Dashboard (Budget Cards + Department Bars + Recent Claims)
│   │   │   ├── claims/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx     # หน้าสร้างใบเบิก (Upload -> AI Scan -> Editable Table -> Submit)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # หน้าดูรายละเอียดบิลรายใบและสถานะการโอน
│   │   │   └── treasury/
│   │   │       └── page.tsx         # หน้าเฉพาะเหรัญญิก (Filter Tabs + Split-Screen Review + QR Modal)
│   │   ├── api/
│   │   │   ├── ocr/
│   │   │   │   └── route.ts         # POST: รับ Base64 Image -> เรียก Gemini 2.5 Flash -> คืน JSON Line Items
│   │   │   └── upload/
│   │   │       └── route.ts         # POST: อัปโหลดรูปลง Supabase Storage Bucket
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── actions/
│   │   ├── claim.actions.ts         # Server Actions: createClaimWithItems, approveClaim, rejectClaim, markClaimPaid
│   │   ├── budget.actions.ts        # Server Actions: getBudgetDashboardData, resetDemoData
│   │   └── user.actions.ts          # Server Actions: getCurrentUser, switchDemoRole
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── RoleSwitcher.tsx     # ปุ่มสลับโหมด Staff / Treasurer แบบ Instant
│   │   ├── dashboard/
│   │   │   ├── MetricCards.tsx
│   │   │   └── DepartmentProgressList.tsx
│   │   ├── claims/
│   │   │   ├── ReceiptDropzone.tsx          # กล่องอัปโหลดรูป + ปุ่มเลือกบิลตัวอย่าง 3 แบบ
│   │   │   ├── EditableReceiptItems.tsx     # ตารางแก้ไขรายการย่อย (ติ๊กเลือก, แก้ราคา, เพิ่ม/ลบแถว)
│   │   │   ├── ClaimMetadataForm.tsx        # ฟอร์มเลือกฝ่าย, ชื่อหัวข้อ, เบอร์พร้อมเพย์
│   │   │   └── StatusBadge.tsx
│   │   ├── treasury/
│   │   │   ├── TreasuryClaimTable.tsx       # ตารางคิวตรวจบิลของเหรัญญิก
│   │   │   ├── SplitReviewDialog.tsx        # Modal ซ้ายรูปบิล ขวาตารางรายการ
│   │   │   └── PromptPayPayoutDialog.tsx    # Modal แสดง QR Code พร้อมเพย์ + ปุ่มยืนยันการโอน
│   │   └── ui/                              # shadcn/ui components
│   ├── lib/
│   │   ├── prisma.ts                        # Prisma Client instance
│   │   ├── supabase.ts                      # Supabase Client & Storage helper
│   │   ├── gemini.ts                        # Gemini 2.5 Flash Structured Output schema & caller
│   │   ├── promptpay.ts                     # Wrapper สำหรับสร้าง EMVCo QR Payload
│   │   └── utils.ts
│   └── types/
│       └── receipt.ts                       # TypeScript Interfaces สำหรับ Line Items และ Claim DTO
├── .env.example
├── package.json
└── README.md
```

---

## 🔌 6. API & Server Action Contracts

| Method / Action | Path / Name | Input Payload | Output / Side Effect |
| --- | --- | --- | --- |
| `POST` | `/api/ocr` | `{ imageBase64: string, mimeType: string }` | คืนค่า JSON `{ title, merchantName, expenseDate, docType, receiptTotal, items: [{ name, quantity, unitPrice, totalPrice }] }` |
| `Server Action` | `createClaimWithItems` | `{ title, departmentId, amount, receiptTotal, receiptImageUrl, docType, promptpayId, items[] }` | บันทึก `Claim` และ `ClaimItem[]` ลง DB ใน Transaction เดียวกัน พร้อม `revalidatePath('/')` |
| `Server Action` | `approveClaim` | `{ claimId: string, reviewerId: string }` | เปลี่ยนสถานะเป็น `APPROVED` และเปิดหน้าต่างสร้าง PromptPay QR |
| `Server Action` | `rejectClaim` | `{ claimId: string, reason: string }` | เปลี่ยนสถานะเป็น `REJECTED` และคืนงบที่กันไว้ออกจากช่อง Reserved |
| `Server Action` | `markClaimPaid` | `{ claimId: string, payoutSlipUrl?: string }` | เปลี่ยนสถานะเป็น `PAID`, บันทึกเวลา `paidAt`, และตัดงบจริงของฝ่ายนั้น |

---

## 🌱 7. Initial Seed Data (ข้อมูลตั้งต้นสำหรับโชว์ตอนสัมภาษณ์)

สคริปต์ `prisma/seed.ts` ควรสร้างข้อมูลจำลองของ **"ค่ายวิศวะพัฒนาน้อง (Larngear Camp)"** งบรวม **50,000 บาท** ดังนี้:

1. **ฝ่ายสวัสดิการ (งบ 20,000 บาท):** มีบิลค่าข้าวกล่องที่โอนคืนแล้ว (`PAID`) 6,500 บาท และบิลค่าน้ำดื่มรออนุมัติ (`PENDING`) 1,200 บาท
2. **ฝ่ายพัสดุและสถานที่ (งบ 15,000 บาท):** มีบิลค่าเช่าเครื่องเสียงโอนแล้ว (`PAID`) 8,000 บาท และบิลซื้ออุปกรณ์ฮาร์ดแวร์ที่อนุมัติแล้วรอสแกนจ่าย (`APPROVED`) 2,450 บาท
3. **ฝ่ายกิจกรรมและสันทนาการ (งบ 10,000 บาท):** มีบิลค่าพร็อพทำกิจกรรมรออนุมัติ (`PENDING`) 890 บาท และบิลที่ถูกตีกลับ (`REJECTED`) 1 รายการ พร้อมเหตุผล *"แนบมาเฉพาะสลิปโอนเงิน รบกวนถ่ายรูปใบเสร็จร้านค้าแนบมาใหม่ครับ"*
4. **ฝ่ายพยาบาลและประสานงาน (งบ 5,000 บาท):** มีบิลค่ายาสามัญโอนแล้ว (`PAID`) 1,100 บาท
