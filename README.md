# 💰 Camp & Club Budget Tracker

> **เว็บแอปพลิเคชันบริหารจัดการงบประมาณและระบบเบิกจ่ายเงิน (Reimbursement Platform) สำหรับค่าย ชมรม และองค์กรนักศึกษา**  
> แก้ปัญหาความล่าช้า เอกสารสูญหาย และการทุจริต/เบิกซ้ำซ้อน ด้วย **AI Receipt Scanner (Gemini Multimodal OCR)**, ระบบคัดแยกของใช้ส่วนตัวออกจากบิลค่าย (**Editable Line-Items Table**), ระบบ **Multi-Workspace** รองรับหลายค่าย, การตรวจสอบบิลแบบ **Split-Screen**, และระบบ **Instant PromptPay QR Payout (EMVCo)** พร้อมศูนย์ส่งออกรายงานการเงิน (**CSV / Excel Export**)

---

## 📑 สารบัญ (Table of Contents)

1. [ภาพรวมของโครงการ (Overview & Problem Statement)](#-1-ภาพรวมของโครงการ-overview--problem-statement)
2. [เทคโนโลยีที่ใช้ (Tech Stack & Architecture)](#-2-เทคโนโลยีที่ใช้-tech-stack--architecture)
3. [ฟีเจอร์เด่นของระบบ (Core Features)](#-3-ฟีเจอร์เด่นของระบบ-core-features)
4. [ขั้นตอนการทำงานของผู้ใช้ (User Workflows)](#-4-ขั้นตอนการทำงานของผู้ใช้-user-workflows)
   * [4.1 สต๊าฟผู้ขอเบิกเงิน (Staff Workflow)](#41-สต๊าฟผู้ขอเบิกเงิน-staff-workflow)
   * [4.2 เหรัญญิก/ผู้ตรวจและจ่ายเงิน (Treasurer Workflow)](#42-เหรัญญิกผู้ตรวจและจ่ายเงิน-treasurer-workflow)
   * [4.3 การสร้างและจัดการค่าย (Multi-Workspace & Onboarding Workflow)](#43-การสร้างและจัดการค่าย-multi-workspace--onboarding-workflow)
   * [4.4 กรรมการประเมินผล (30-Second Fast Demo Flow)](#44-กรรมการประเมินผล-30-second-fast-demo-flow)
5. [โครงสร้างฐานข้อมูล (Database Schema & Architecture)](#-5-โครงสร้างฐานข้อมูล-database-schema--architecture)
6. [โครงสร้างโฟลเดอร์ของโปรเจกต์ (Project Directory Structure)](#-6-โครงสร้างโฟลเดอร์ของโปรเจกต์-project-directory-structure)
7. [การติดตั้งและเริ่มต้นใช้งาน (Getting Started & Setup Guide)](#-7-การติดตั้งและเริ่มต้นใช้งาน-getting-started--setup-guide)
8. [บัญชีทดสอบระบบ (Demo Credentials)](#-8-บัญชีทดสอบระบบ-demo-credentials)

---

## 🎯 1. ภาพรวมของโครงการ (Overview & Problem Statement)

การจัดกิจกรรมค่ายหรือโครงการนักศึกษาส่วนใหญ่มักประสบปัญหาด้านการเงินที่ซ้ำซาก:
* **เอกสารกระจัดกระจาย:** ส่งบิลผ่าน LINE หรือ Google Forms ข้อมูลสูญหายและติดตามสถานะได้ยาก
* **บิลรวมของส่วนตัว:** สต๊าฟไปซื้อของเข้าค่ายที่ Makro/7-Eleven แต่มักมีของใช้ส่วนตัว (เช่น ขนม, อาหารสัตว์) รวมอยู่ในใบเสร็จเดียวกัน ทำให้ต้องมานั่งบวกลบเลขด้วยมือ
* **ปัญหาภาษีมูลค่าเพิ่ม (VAT 7%):** ในใบกำกับภาษีเต็มรูป บางครั้งยอดสินค้าไม่รวม VAT ทำให้ยอดขอเบิกคลาดเคลื่อนกับยอดท้ายบิล
* **งบบานปลายไม่รู้ตัว:** ฝ่ายต่างๆ ไม่รู้ว่างบประมาณคงเหลือของฝ่ายตนเองเหลือเท่าไหร่ จนกระทั่งเงินหมด
* **การจ่ายเงินล่าช้า:** เหรัญญิกต้องคอยทวงเลขบัญชี พิมพ์ยอดเงินโอนเอง เสี่ยงต่อการโอนเงินผิดยอดหรือผิดคน

**Camp Budget Tracker** ถูกออกแบบมาเพื่อปิดช่องว่างเหล่านี้อย่างเบ็ดเสร็จ ผ่านระบบดิจิทัลอัตโนมัติที่ใช้งานง่ายทั้งบนคอมพิวเตอร์และมือถือ

---

## 🛠 2. เทคโนโลยีที่ใช้ (Tech Stack & Architecture)

| ส่วนของระบบ | เทคโนโลยีที่เลือกใช้ | รายละเอียดการนำไปใช้งาน |
| :--- | :--- | :--- |
| **Core Framework** | **Next.js 15 (App Router)** | รองรับ React 19, Server Actions, Server Components, Streaming SSR |
| **Language** | **TypeScript 5** | Strict Type Safety ตลอดทั้ง Client, Server Actions และ Database Queries |
| **Styling & UI** | **Tailwind CSS 3.4** + **Lucide React** | ดีไซน์ทันสมัย Responsive 100% ใช้งานได้ทั้งสมาร์ทโฟนและเดสก์ท็อป |
| **Authentication** | **Better Auth** + **Custom Auth Engine** | ระบบล็อกอินปลอดภัย Session Cookies, รองรับ Password Hashing และ One-Click Fast Login |
| **Database & ORM** | **PostgreSQL (Supabase)** + **Prisma ORM 7** | ฐานข้อมูลเชิงสัมพันธ์ พร้อมคำนวณเงินทศนิยม 2 ตำแหน่งด้วย `@db.Decimal(12, 2)` |
| **File & Receipt Storage** | **Supabase Storage (S3-Compatible API)** | อัปโหลดผ่าน `@aws-sdk/client-s3` พร้อม Non-blocking Upload และ Client-Side Instant Preview |
| **AI OCR Engine** | **Google Gemini (`@google/genai`)** | โมเดล Multimodal (`gemini-2.5-flash` / `gemini-3.5-flash`) สกัดข้อมูลหัวบิล ตารางสินค้า และ VAT 7% |
| **Payment Utility** | **`promptpay-qr`** + **`qrcode.react`** | สตรีม EMVCo Thai QR Code ล็อกยอดเงินโอนคืนและเบอร์พร้อมเพย์อัตโนมัติ |
| **Data Export** | **CSV Engine (UTF-8 BOM)** | ส่งออกรายงานการเงินรองรับภาษาไทย 100% เปิดใน Microsoft Excel / Google Sheets ได้ทันที |

---

## ✨ 3. ฟีเจอร์เด่นของระบบ (Core Features)

### 🏢 3.1 ระบบหลายค่าย / หลายชมรม (Multi-Workspace Architecture)
* **Isolated Workspaces:** แยกงบประมาณ สมาชิก แผนก และรายการเบิกจ่ายของแต่ละค่ายออกจากกันอย่างอิสระ
* **Workspace Onboarding Wizard:** ตัวช่วยตั้งค่าค่ายใหม่ 3 ขั้นตอน:
  1. *ข้อมูลพื้นฐาน:* ชื่อค่าย, รหัสย่อค่าย (Workspace Code เช่น `LG-2026`), คำอธิบาย, งบประมาณรวม
  2. *โครงสร้างฝ่ายและงบประมาณ:* มี Presets ให้เลือก (ค่ายกิจกรรม, ชมรมสโมสร, องค์กรทั่วไป) ปรับเปลี่ยนงบและธีมสีของฝ่ายได้อิสระ
  3. *เชิญทีมงาน:* เชิญสมาชิกร่วมค่ายล่วงหน้าผ่านอีเมลพร้อมกำหนดบทบาท (Staff หรือ Treasurer)
* **Join Workspace by Code:** สต๊าฟสามารถกรอกรหัสค่าย (เช่น `LG-2026`) เพื่อส่งคำขอเข้าร่วมค่ายได้ทันที พร้อมระบบติดตามและยกเลิกคำขอ
* **Team & Member Management:** เหรัญญิกสามารถอนุมัติ/ปฏิเสธคำขอเข้าร่วม, เชิญสมาชิกใหม่ทางอีเมล, และลบสมาชิกออกจากค่ายได้
* **Navbar Workspace Switcher:** สลับค่ายที่กำลังทำงานได้อย่างรวดเร็วจากแถบเมนูด้านบน

---

### 🤖 3.2 AI สแกนใบเสร็จอัจฉริยะ (Smart Gemini Receipt Scanner)
* **Multimodal Document Processing:** สกัดข้อความภาษาไทยและตัวเลขจากรูปใบเสร็จ, ใบกำกับภาษี, บิลเงินสดเขียนมือ, และสลิปโอนเงินธนาคาร
* **4-Stage Visual Progress Bar:** แสดงสถานะการสแกนแบบ Real-time (1. โหลดภาพ ➔ 2. อ่านข้อความ ➔ 3. สินค้า & VAT ➔ 4. ตรวจยอดรวม) พร้อมเวลานับถอยหลังและมาตรการ Timeout ป้องกันค้าง
* **Automatic VAT 7% Reconciliation:** ตรวจจับกรณีใบกำกับภาษีที่มีภาษีมูลค่าเพิ่ม หากรายการสินค้ารวมกันไม่เท่ากับยอดสุทธิท้ายบิล ระบบจะสร้างรายการ `ภาษีมูลค่าเพิ่ม 7% (VAT 7%)` เข้าตารางสินค้าให้อัตโนมัติ เพื่อให้ยอดเงินขอเบิกตรงกับยอดท้ายบิลจริง
* **One-Click Demo Receipts:** บิลตัวอย่าง 3 แบบสำหรับทดสอบระบบได้ทันทีโดยไม่ต้องถ่ายรูปจริง:
  1. *ใบกำกับภาษี Makro:* บิลยาว มีของใช้ส่วนตัวปนมา และมี VAT 7%
  2. *สลิปโอนเงิน K+:* ค่าเช่าเครื่องเสียง 8,000 บาท
  3. *บิลเงินสดเขียนมือ:* ค่าอาหารตามสั่ง 6,500 บาท
* **Instant Fallback Engine:** กรณีไม่ได้เชื่อมต่อคีย์ Gemini หรือติดโควต้า ระบบมี Fallback Mock Data ที่สกัดผลลัพธ์ได้อย่างแม่นยำสำหรับการสาธิต

---

### 📝 3.3 ตารางตรวจสอบและตัดของส่วนตัว (Interactive Editable Line-Items)
* **Selective Claim Checkboxes:** สต๊าฟสามารถกดติ๊ก Checkbox ออกในรายการสินค้าที่เป็น **"ของใช้ส่วนตัว"** (เช่น ขนมหรืออาหารแมวที่ซื้อพร้อมของค่าย) เพื่อไม่นำมาคิดเป็นยอดเบิกของค่าย
* **Real-time Recalculation:** คำนวณยอดเงินขอเบิกสุทธิใหม่ทันทีเมื่อมีการติ๊กเลือก/ยกเลิก หรือแก้ไขรายการ
* **Inline Table Editing:** แก้ไขชื่อสินค้า, จำนวน, ราคาต่อหน่วย, และราคารวมได้โดยตรงในตาราง กรณี AI อ่านตัวเลขลายมือคลาดเคลื่อน
* **Row Actions:** ปุ่มเพิ่มรายการใหม่ (`+ เพิ่มรายการ`) และปุ่มลบรายการที่ไม่เกี่ยวข้องออก
* **VAT Helper Shortcut:** ปุ่ม `+ เพิ่มแถวภาษีมูลค่าเพิ่ม (VAT 7%)` ในคลิกเดียว ช่วยคำนวณส่วนต่างภาษีให้อัตโนมัติ
* **Discrepancy Warning Badge:** แถบเตือนอัจฉริยะเทียบผลรวมในตารางกับ `ยอดรวมท้ายบิล` ที่สแกนได้ หากตัวเลขไม่ตรงกันจะแสดงเตือนเพื่อความโปร่งใส

---

### ⚖️ 3.4 หน้าต่างตรวจสอบบิลแบบจอคู่ (Split-Screen Verification Modal)
* **Dual-Pane Audit Interface:**
  * **จอฝั่งซ้าย:** แสดงภาพใบเสร็จต้นฉบับความละเอียดสูง พร้อมเครื่องมือ **ซูมเข้า (Zoom In), ซูมออก (Zoom Out), และรีเซ็ตขนาด**
  * **จอฝั่งขวา:** สรุปข้อมูลผู้เบิก, ฝ่าย, วันที่, ประเภทเอกสาร, รายการสินค้าที่ขอเบิก, รายการส่วนตัวที่ตัดออก, และยอดเบิกสุทธิ
* **Mobile-Responsive Tabs:** บนหน้าจอมือถือ สามารถสลับดูระหว่างแท็บ "รูปใบเสร็จ" และ "รายละเอียด" ได้อย่างสะดวก
* **Actionable Decisions:** ปุ่ม `Approve & Pay` เพื่ออนุมัติและเปิดหน้าโอนเงินทันที หรือปุ่ม `Reject` เพื่อระบุเหตุผลในการตีกลับเอกสาร (เช่น "รูปถ่ายไม่ชัดเจน รบกวนแนบใหม่")

---

### 📱 3.5 ระบบจ่ายเงินคืนผ่าน PromptPay QR อัตโนมัติ (EMVCo QR Payout)
* **Dynamic QR Generation:** สร้าง QR Code มาตรฐาน EMVCo จากหมายเลขพร้อมเพย์ (เบอร์โทรศัพท์/เลขบัตรประชาชน) ของผู้เบิก
* **Amount Locking:** ล็อกยอดเงินโอนคืนให้ตรงกับยอดที่อนุมัติอัตโนมัติ เหรัญญิกเพียงเปิดแอปธนาคารใดก็ได้แล้วสแกนจ่ายได้ทันที ป้องกันความผิดพลาดจากการพิมพ์เลขบัญชีหรือยอดเงินผิด
* **One-Click Payout Slip & Confirmation:** เหรัญญิกสามารถกดยืนยันการโอนเงิน (หรือแนบสลิปโอนเงินคืน) เพื่อเปลี่ยนสถานะเป็น `PAID` ซึ่งจะตัดงบประมาณจริงในระบบทันที

---

### 📊 3.6 แดชบอร์ดงบประมาณแบบ Real-Time (Budget Tracking Dashboard)
* **4 Metric Cards:**
  1. `Total Allocated Budget`: งบประมาณรวมที่จัดสรรให้กับค่าย
  2. `Actual Disbursed`: ยอดเงินที่โอนจ่ายคืนสำเร็จแล้ว (สถานะ `PAID`)
  3. `Pending / Reserved`: ยอดเงินที่กำลังรออนุมัติหรือรอโอน (สถานะ `PENDING` + `APPROVED`) ถูกกันไว้เพื่อไม่ให้ฝ่ายอื่นใช้เกิน
  4. `Available Balance`: งบคงเหลือสุทธิที่เบิกได้จริง (`งบรวม - จ่ายแล้ว - รอจ่าย`)
* **Department Budget Bars:** แถบแสดงสัดส่วนการใช้งบประมาณแยกรายฝ่าย พร้อมระบบเปลี่ยนสีเตือนภัยตามเปอร์เซ็นต์:
  * 🟢 **สีเขียว:** ใช้งบไปไม่เกิน 75%
  * 🟡 **สีเหลือง:** ใช้งบไประหว่าง 75% – 90% (เริ่มเตือนใกล้เต็มงบ)
  * 🔴 **สีแดง:** ใช้งบเกิน 90% ขึ้นไป (เตือนระดับวิกฤต)

---

### 📑 3.7 ศูนย์ส่งออกรายงานการเงิน (Treasury CSV/Excel Export Center)
* **UTF-8 BOM Support:** ป้องกันปัญหาภาษาไทยเป็นภาษาต่างดาวเมื่อเปิดด้วยโปรแกรม Microsoft Excel บน Windows และ Mac
* **3 รูปแบบรายงานครอบคลุมการตรวจสอบ:**
  1. *รายงานสรุปบิลเบิกจ่าย (Claims Summary):* สรุปทุกรายการเบิก เลขที่บิล ผู้เบิก ฝ่าย ยอดรวม VAT ยอดสุทธิ และสถานะ
  2. *รายงานรายการสินค้าละเอียด (Detailed Line Items):* แจกแจงสินค้าทุกบรรทัด ราคาต่อหน่วย จำนวน และสถานะการเบิกค่าย/ของส่วนตัว
  3. *รายงานงบประมาณแยกตามฝ่าย (Department Budget Summary):* สรุปงบที่ได้รับ งบที่จ่ายไป งบที่รออนุมัติ และงบคงเหลือของแต่ละฝ่าย
* **Status Filter:** กรองส่งออกเฉพาะบิลที่จ่ายแล้ว (`PAID`), บิลที่กำลังดำเนินการ (`PENDING/APPROVED`), หรือทั้งหมดได้

---

### 👤 3.8 การจัดการข้อมูลผู้ใช้และหมายเลขพร้อมเพย์ (User Profile Modal)
* ผู้ใช้สามารถคลิกที่ชื่อโปรไฟล์บนแถบ Navbar เพื่อตรวจสอบและอัปเดตชื่อ-นามสกุล และหมายเลขพร้อมเพย์ (PromptPay ID) สำหรับรับเงินคืนได้ตลอดเวลา มีระบบตรวจสอบความถูกต้องของรูปแบบเบอร์โทรศัพท์ 10 หลัก

---

## 🔄 4. ขั้นตอนการทำงานของผู้ใช้ (User Workflows)

### 4.1 สต๊าฟผู้ขอเบิกเงิน (Staff Workflow)

```mermaid
flowchart TD
    Start([เข้าสู่ระบบในฐานะ Staff]) --> CheckWorkspace{มีสังกัดค่ายแล้วหรือยัง?}
    CheckWorkspace -- ยังไม่มีค่าย --> EnterCode[กรอกรหัสค่าย เช่น LG-2026] --> WaitApproval[รอเหรัญญิกกดอนุมัติเข้าค่าย] --> EnterPortal
    CheckWorkspace -- มีค่ายแล้ว --> EnterPortal[เข้าหน้า Staff Portal]
    
    EnterPortal --> Step1[ตรวจสอบหลอดงบประมาณคงเหลือของฝ่ายตนเอง]
    Step1 --> Step2[อัปโหลดรูปใบเสร็จ หรือกดเลือกบิลตัวอย่าง]
    Step2 --> Step3[AI Gemini สแกนและสกัดรายการสินค้า + VAT 7%]
    
    Step3 --> Step4[ตรวจสอบตาราง Editable Line-Items]
    Step4 --> ActionA[ติ๊ก Checkbox ออก สำหรับของใช้ส่วนตัว]
    Step4 --> ActionB[แก้ไขชื่อ / จำนวน / ราคาต่อหน่วย หากจำเป็น]
    Step4 --> ActionC[ตรวจสอบหรือกดเพิ่ม VAT 7% กรณีบิลไม่ตรง]
    
    ActionA --> Calc[ระบบคำนวณยอดขอเบิกสุทธิ Real-Time]
    ActionB --> Calc
    ActionC --> Calc
    
    Calc --> Step5[เลือกฝ่ายที่ต้องการเบิก และตรวจเบอร์พร้อมเพย์รับเงิน]
    Step5 --> Step6[กดยืนยันส่งบิลเบิกเงิน Submit Claim]
    Step6 --> DoneStaff[สถานะเป็น PENDING งบถูกกันไว้ในช่อง Reserved ทันที]
```

---

### 4.2 เหรัญญิก/ผู้ตรวจและจ่ายเงิน (Treasurer Workflow)

```mermaid
flowchart TD
    StartTreasury([เข้าสู่ระบบในฐานะ Treasurer]) --> TabQueue[เปิดแท็บ Verification Queue]
    TabQueue --> ReviewList[ดูรายการบิลที่รอตรวจ สถานะ PENDING]
    ReviewList --> ClickReview[กดปุ่ม 'ตรวจสอบบิล' เพื่อเปิด Split-Screen Modal]
    
    ClickReview --> Inspect[จอซ้าย: ซูมดูรูปใบเสร็จจริง / จอขวา: ตรวจสอบรายการที่ขอเบิก]
    Inspect --> Decision{เอกสารถูกต้องหรือไม่?}
    
    Decision -- เอกสารไม่ถูกต้อง/ไม่ผ่าน --> RejectFlow[กดปุ่ม Reject ➔ พิมพ์เหตุผลการตีกลับ ➔ ส่งกลับให้สต๊าฟแก้ไข]
    Decision -- เอกสารถูกต้องครบถ้วน --> ApproveFlow[กดปุ่ม Approve & Pay]
    
    ApproveFlow --> StatusApproved[สถานะเปลี่ยนเป็น APPROVED]
    StatusApproved --> PromptPayModal[ระบบสร้าง EMVCo PromptPay QR Code ล็อกยอดเงินอัตโนมัติ]
    
    PromptPayModal --> ScanPay[เหรัญญิกเปิดแอปธนาคารบนมือถือ สแกน QR โอนเงินคืน]
    ScanPay --> MarkPaid[กดยืนยันการโอนเงิน Mark as Paid พร้อมแนบสลิป]
    
    MarkPaid --> StatusPaid[สถานะเปลี่ยนเป็น PAID]
    StatusPaid --> UpdateDashboard[งบประมาณย้ายจาก Reserved ไปเป็น Actual Disbursed ทันที]
```

---

### 4.3 การสร้างและจัดการค่าย (Multi-Workspace & Onboarding Workflow)

```mermaid
flowchart TD
    CreateWS[เหรัญญิกกดสร้างค่ายใหม่] --> Step1[Step 1: กรอกชื่อค่าย, รหัสย่อ เช่น TC-2026, งบประมาณรวม]
    Step1 --> Step2[Step 2: จัดสรรงบประมาณรายฝ่าย เลือกจาก Presets หรือเพิ่มเอง]
    Step2 --> Step3[Step 3: เชิญอีเมลทีมงานล่วงหน้า ระบุบทบาท Staff/Treasurer]
    Step3 --> FinishWS[เสร็จสิ้น: ระบบสร้าง Workspace และสลับเข้าใช้งานทันที]
    
    StaffJoin[สต๊าฟส่งคำขอเข้าร่วมด้วยรหัสค่าย] --> RequestPending[คำขอเข้าสู่คิวรออนุมัติ]
    RequestPending --> TreasurerManage[เหรัญญิกเปิดแท็บ 'ทีมงาน & สมาชิกค่าย']
    TreasurerManage --> ActionApprove[กด Approve ➔ สต๊าฟเข้าใช้งานค่ายได้ทันที]
```

---

### 4.4 กรรมการประเมินผล (30-Second Fast Demo Flow)

เพื่อให้กรรมการและผู้ทดสอบสามารถตรวจประเมินฟังก์ชันหลักทั้งหมดได้ภายใน **30 วินาที**:

```text
[1. หน้าล็อกอิน]
  └── กดปุ่ม "⚡ 1-Click Fast Access: Staff ผู้เบิก" (เข้าสู่ระบบทันทีโดยไม่ต้องพิมพ์รหัส)

[2. หน้า Staff Portal]
  └── กดปุ่ม "🧾 1. ใบกำกับภาษี Makro" (ในกล่องบิลตัวอย่าง)
  └── เห็น AI สแกน 4 ขั้นตอน ➔ สกัดรายการออกมาเป็นตาราง
  └── สังเกตว่ารายการ "อาหารแมววิสกัส" และ "ชานมเย็น" ถูกติ๊กออกเป็นของส่วนตัวให้อัตโนมัติ
  └── ลองแก้ไขจำนวนหรือราคา ➔ ยอดเบิกคำนวณใหม่ทันที
  └── กดปุ่ม "ยืนยันส่งเบิกเงิน (Submit Claim)"

[3. สลับบทบาทไปเป็นเหรัญญิก]
  └── กดปุ่ม Logout หรือเปิดหน้า Login แล้วกด "⚖️ 1-Click Fast Access: เหรัญญิกค่าย"

[4. หน้า Treasury Workspace]
  └── ในตารางคิวบิล กดปุ่ม "ตรวจสอบบิล (Review)" ที่บิลที่เพิ่งส่ง
  └── หน้าจอ Split-Screen เด้งขึ้นมา ➔ ซูมดูรูปใบเสร็จฝั่งซ้ายเทียบตารางสินค้าฝั่งขวา
  └── กดปุ่ม "อนุมัติและดำเนินการจ่าย (Approve & Pay)"
  └── หน้าต่าง PromptPay QR Code ล็อกยอดเงินเด้งขึ้นมา
  └── กดปุ่ม "ยืนยันว่าโอนเงินแล้ว (Confirm Paid)"
  └── แดชบอร์ดและหลอดงบประมาณอัปเดตยอดใช้จริงทันที
```

---

## 🗄 5. โครงสร้างฐานข้อมูล (Database Schema & Architecture)

ระบบใช้ฐานข้อมูล **PostgreSQL** บน Supabase เชื่อมต่อผ่าน **Prisma ORM** โดยมีการออกแบบตารางเพื่อรองรับระบบ Multi-Tenant และความถูกต้องทางบัญชีดังนี้:

```mermaid
erDiagram
    User ||--o{ Account : "has"
    User ||--o{ Session : "has"
    User ||--o{ Workspace : "owns"
    User ||--o{ WorkspaceMember : "belongs to"
    User ||--o{ Claim : "submits"
    User ||--o{ Claim : "reviews"
    
    Workspace ||--o{ WorkspaceMember : "has members"
    Workspace ||--o{ Department : "contains"
    Workspace ||--o{ Claim : "contains"
    
    Department ||--o{ Claim : "categorizes"
    Claim ||--o{ ClaimItem : "contains line items"

    User {
        string id PK
        string name
        string email UK
        enum role "STAFF | TREASURER"
        string promptpayId
        string passwordHash
    }

    Workspace {
        string id PK
        string name
        string code
        string description
        decimal totalBudget
        string ownerId FK
    }

    WorkspaceMember {
        string id PK
        string workspaceId FK
        string userId FK
        enum role "STAFF | TREASURER"
        string status "ACTIVE | PENDING"
    }

    Department {
        string id PK
        string workspaceId FK
        string name
        string color
        decimal allocatedBudget
    }

    Claim {
        string id PK
        string workspaceId FK
        string departmentId FK
        string submitterId FK
        string reviewerId FK
        string title
        string merchantName
        decimal amount
        decimal receiptTotal
        enum docType "BANK_SLIP | CASH_RECEIPT | TAX_INVOICE | OTHER"
        enum status "PENDING | APPROVED | PAID | REJECTED"
        string promptpayId
        string receiptImageUrl
        string rejectReason
        string payoutSlipUrl
        datetime paidAt
    }

    ClaimItem {
        string id PK
        string claimId FK
        string name
        int quantity
        decimal unitPrice
        decimal totalPrice
        boolean isClaimed "true=เบิกค่าย, false=ของส่วนตัว"
    }
```

### 💡 จุดเด่นด้านสถาปัตยกรรมข้อมูล:
1. **Decimal Precision:** ยอดเงินทั้งหมดใช้ชนิดข้อมูล `@db.Decimal(12, 2)` ป้องกันปัญหาความคลาดเคลื่อนของทศนิยมจากการคำนวณแบบ Floating Point
2. **Selective Claiming Persistence:** แต่ละบรรทัดสินค้าใน `ClaimItem` มีฟิลด์ `isClaimed` เก็บสถานะการเบิกค่าย ทำให้ตรวจสอบย้อนหลังได้ว่าของส่วนตัวใดถูกคัดออกไปบ้าง
3. **Multi-Workspace Isolation:** ข้อมูล `Department` และ `Claim` มีการเชื่อมโยง Foreign Key ตรงกับ `Workspace` พร้อมดัชนี (`@@index`) เพิ่มความรวดเร็วในการ Query

---

## 📁 6. โครงสร้างโฟลเดอร์ของโปรเจกต์ (Project Directory Structure)

```text
ywc-budget-platform/
├── prisma/
│   ├── schema.prisma             # โครงสร้างฐานข้อมูล PostgreSQL + Prisma Schema
│   └── seed.ts                   # สคริปต์สร้างข้อมูลจำลองค่ายและผู้ใช้เริ่มต้น
├── public/
│   └── sample-receipts/          # บิลตัวอย่าง SVG (บิล Makro, สลิป K+, บิลเงินสดเขียนมือ)
├── src/
│   ├── actions/                  # Next.js Server Actions (Type-safe backend logic)
│   │   ├── budget.actions.ts     # คำนวณสรุปสถิติงบประมาณและตัวชี้วัดแดชบอร์ด
│   │   ├── claim.actions.ts      # สร้างบิล, อนุมัติบิล, ปฏิเสธบิล, บันทึกการจ่ายเงิน
│   │   ├── user.actions.ts       # ยืนยันตัวตน, ลงทะเบียน, จัดการโปรไฟล์และพร้อมเพย์
│   │   └── workspace.actions.ts  # สร้างค่าย, สลับค่าย, จัดการสมาชิก, อนุมัติรหัสเข้าร่วม
│   ├── app/                      # Next.js App Router (Pages & API Endpoints)
│   │   ├── (auth)/login/         # หน้าเข้าสู่ระบบและสร้างบัญชี พร้อม 1-Click Fast Access
│   │   ├── (dashboard)/          # หน้าหลักตามสิทธิ์การใช้งาน
│   │   │   ├── page.tsx          # Smart Router (นำส่งไปหน้า Staff หรือ Treasury ตาม Role)
│   │   │   ├── treasury/         # แดชบอร์ดและคิวงานของเหรัญญิก
│   │   │   └── claims/[id]/      # หน้ารายละเอียดการเบิกและประวัติการตรวจสอบ
│   │   ├── api/
│   │   │   ├── auth/[...all]/    # Better Auth Handler
│   │   │   ├── ocr/route.ts      # API Endpoint เชื่อมต่อ Gemini Vision OCR
│   │   │   └── upload/route.ts   # API Endpoint อัปโหลดไฟล์สู่ Supabase S3 Storage
│   │   ├── layout.tsx            # Root Layout
│   │   └── globals.css           # Global Tailwind CSS Styles
│   ├── components/               # React Components
│   │   ├── claims/               # คอมโพเนนต์ส่งบิล (Dropzone, Editable Items, Metadata)
│   │   ├── dashboard/            # คอมโพเนนต์แสดงผล Metric Cards และหลอดงบประมาณฝ่าย
│   │   ├── layout/               # แถบ Navbar ด้านบน พร้อม Workspace Switcher
│   │   ├── profile/              # Modal อัปเดตโปรไฟล์และเบอร์ PromptPay
│   │   ├── staff/                # หน้าหลักของสต๊าฟ (Staff Workspace & No Workspace View)
│   │   ├── treasury/             # คอมโพเนนต์เหรัญญิก (Split-Review, QR Payout, CSV Export)
│   │   ├── ui/                   # Primitive UI Components (Buttons, Dialogs, Inputs, Badges)
│   │   └── workspace/            # Wizard ตั้งค่าค่าย และระบบจัดการสมาชิกค่าย
│   ├── lib/                      # ยูทิลิตี้และไลบรารีส่วนกลาง
│   │   ├── auth.ts               # การกำหนดค่า Better Auth
│   │   ├── gemini.ts             # ตรรกะเรียก Gemini Vision API และ VAT 7% Auto-Reconciliation
│   │   ├── prisma.ts             # Singleton Prisma Client Instance
│   │   ├── promptpay.ts          # ตัวสร้าง EMVCo Payload สำหรับ PromptPay QR
│   │   ├── s3-storage.ts         # ไคลเอนต์เชื่อมต่อ Supabase S3 Storage
│   │   └── utils.ts              # ฟังก์ชันจัดรูปแบบเงินตรา (THB), วันที่ และเบอร์โทรศัพท์
│   └── types/
│       └── receipt.ts            # Type Definitions (DTOs, Roles, Status, Forms)
├── .env.example                  # ไฟล์ตัวอย่าง Environment Variables
├── middleware.ts                 # Route Guard และ Security Headers
├── package.json                  # Dependencies และ Scripts
└── tsconfig.json                 # การตั้งค่า TypeScript
```

---

## 🚀 7. การติดตั้งและเริ่มต้นใช้งาน (Getting Started & Setup Guide)

### สิ่งที่ต้องเตรียมล่วงหน้า (Prerequisites)
* **Node.js:** เวอร์ชัน 18.18 ขึ้นไป (แนะนำ Node.js 20 หรือ 22)
* **ฐานข้อมูล PostgreSQL:** แนะนำใช้โปรเจกต์ฟรีจาก [Supabase](https://supabase.com)
* **Google Gemini API Key:** รับได้ฟรีจาก [Google AI Studio](https://aistudio.google.com/)

---

### ขั้นตอนการติดตั้ง (Step-by-step Installation)

#### 1. Clone คลังเก็บโค้ดและติดตั้ง Dependencies
```bash
git clone <repository-url>
cd ywc-budget-platform
npm install
```

#### 2. คัดลอกและตั้งค่า Environment Variables
สร้างไฟล์ `.env` จากตัวอย่าง `.env.example`:
```bash
cp .env.example .env
```
กรอกค่าคอนฟิกูเรชันสำคัญใน `.env`:
```env
# ฐานข้อมูล Supabase PostgreSQL (IPv4 Pooler URL)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Google Gemini API Key สำหรับสแกนบิล
GEMINI_API_KEY="AIzaSy..."

# Better Auth Secret (ความยาวอย่างน้อย 32 ตัวอักษร)
BETTER_AUTH_SECRET="camp-budget-tracker-super-secret-key-2026-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase Storage S3-Compatible Configuration (Optional หากต้องการอัปโหลดจริงขึ้นคลาวด์)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_S3_ENDPOINT="https://[PROJECT-REF].supabase.co/storage/v1/s3"
SUPABASE_S3_REGION="ap-northeast-2"
SUPABASE_S3_BUCKET="receipts"
SUPABASE_S3_ACCESS_KEY_ID="..."
SUPABASE_S3_SECRET_ACCESS_KEY="..."
```

#### 3. ซิงก์โครงสร้างฐานข้อมูลและสร้างข้อมูลจำลอง (Prisma Migration & Seed)
```bash
# พุช Schema เข้าสู่ PostgreSQL
npm run db:push

# ใส่ข้อมูลตัวอย่าง (สร้าง 2 ค่ายจำลอง, ผู้ใช้ Staff, ผู้ใช้ Treasurer และบิลตัวอย่าง)
npm run db:seed
```

#### 4. รัน Development Server
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

---

## 🔑 8. บัญชีทดสอบระบบ (Demo Credentials)

ท่านสามารถเข้าสู่ระบบเพื่อทดสอบได้ 2 วิธี:

### วิธีที่ 1: กดปุ่ม "⚡ 1-Click Fast Access" บนหน้า Login
หน้าล็อกอินมีปุ่มทางลัดพิเศษให้คลิกเพื่อเข้าสู่ระบบเป็น **Staff ผู้เบิก** หรือ **เหรัญญิกค่าย** ได้ทันทีในคลิกเดียวโดยไม่ต้องพิมพ์อีเมลและรหัสผ่าน

### วิธีที่ 2: กรอกอีเมลและรหัสผ่านแบบปกติ

| บทบาท (Role) | อีเมล (Email) | รหัสผ่าน (Password) | หน้าที่และความสามารถหลัก |
| :--- | :--- | :--- | :--- |
| **👤 Staff (ผู้ขอเบิกเงิน)** | `staff@larngear.camp` | `password123` | • สแกนบิลด้วย AI<br>• ตัดของใช้ส่วนตัวออกจากบิลค่าย<br>• ติดตามสถานะบิลของตนเอง<br>• ขอเข้าร่วมค่ายด้วยรหัสย่อ |
| **⚖️ Treasurer (เหรัญญิก)** | `treasurer@larngear.camp` | `password123` | • ตรวจสอบบิลแบบ Split-Screen<br>• สร้าง PromptPay QR โอนเงินคืน<br>• บริหารงบประมาณรายฝ่าย<br>• สร้างค่ายใหม่และอนุมัติสมาชิก<br>• ส่งออกรายงานการเงิน CSV/Excel |

---

## 🔒 9. ความปลอดภัยและการปฏิบัติตามมาตรฐาน (Security & Compliance)
* **Role-Based Access Control (RBAC):** มีการตรวจสอบสิทธิ์ทั้งในระดับ Next.js Middleware, Server Actions, และ Route Guards ป้องกันไม่ให้สต๊าฟเข้าถึงหน้าเหรัญญิก หรือเข้าถึงข้อมูลบิลของบุคคลอื่น
* **Security Headers:** กำหนด `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, และ `Referrer-Policy: strict-origin-when-cross-origin` เพื่อป้องกันการโจมตีประเภท Clickjacking และ MIME-sniffing
* **Input Validation & Sanitization:** ใช้ Schema Validation (`zod`) และการจำกัดขนาดไฟล์อัปโหลดไม่เกิน 10MB พร้อมตรวจสอบ MIME Type
* **Financial Data Integrity:** ใช้ Prisma Transactions ในจุดที่มีการตัดงบและอัปเดตสถานะทางการเงิน ป้องกันข้อผิดพลาดแบบ Race Condition

---

<div align="center">
  <sub>พัฒนาขึ้นด้วยความใส่ใจ เพื่อยกระดับความโปร่งใสและประสิทธิภาพการบริหารการเงินค่ายเยาวชนไทย 🇹🇭</sub>
</div>
