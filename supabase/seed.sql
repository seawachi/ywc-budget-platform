-- ==============================================================================
-- Initial Seed Data: ค่ายวิศวะพัฒนาน้อง (Larngear Camp) งบรวม 50,000 บาท
-- ==============================================================================

-- 1. Insert Initial Users
INSERT INTO "User" ("id", "email", "name", "role", "promptpayId") VALUES
  ('demo-staff-id', 'staff@larngear.camp', 'สมชาย หมายมั่น (Staff ฝ่ายสวัสดิการ)', 'STAFF', '0812345678'),
  ('demo-treasurer-id', 'treasurer@larngear.camp', 'สมหญิง รอบคอบ (Treasurer ค่าย)', 'TREASURER', '0898765432')
ON CONFLICT ("id") DO NOTHING;

-- 2. Insert 4 Departments (Total: 50,000 THB)
INSERT INTO "Department" ("id", "name", "color", "allocatedBudget") VALUES
  ('dept-welfare', 'ฝ่ายสวัสดิการ', '#10B981', 20000),
  ('dept-logistics', 'ฝ่ายพัสดุและสถานที่', '#3B82F6', 15000),
  ('dept-activities', 'ฝ่ายกิจกรรมและสันทนาการ', '#F59E0B', 10000),
  ('dept-medical', 'ฝ่ายพยาบาลและประสานงาน', '#EC4899', 5000)
ON CONFLICT ("id") DO NOTHING;

-- 3. Insert Claims
-- 3.1 Welfare: PAID 6,500
INSERT INTO "Claim" ("id", "title", "merchantName", "amount", "receiptTotal", "expenseDate", "receiptImageUrl", "docType", "promptpayId", "status", "departmentId", "submitterId", "reviewerId", "paidAt") VALUES
  ('claim-welfare-1', 'ค่าข้าวกล่องมื้อกลางวัน วันเตรียมค่าย', 'ร้านป้าสมใจ อาหารตามสั่ง', 6500, 6500, NOW() - INTERVAL '3 days', '/sample-receipts/handwritten-bill.svg', 'CASH_RECEIPT', '0812345678', 'PAID', 'dept-welfare', 'demo-staff-id', 'demo-treasurer-id', NOW() - INTERVAL '2 days')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ClaimItem" ("id", "claimId", "name", "quantity", "unitPrice", "totalPrice", "isClaimed") VALUES
  ('item-w1-1', 'claim-welfare-1', 'ข้าวกล่องหมูกรอบไข่ดาว 100 กล่อง', 100, 60, 6000, true),
  ('item-w1-2', 'claim-welfare-1', 'น้ำซุปกระดูกหมูหม้อใหญ่', 1, 500, 500, true)
ON CONFLICT ("id") DO NOTHING;

-- 3.2 Welfare: PENDING 1,200
INSERT INTO "Claim" ("id", "title", "merchantName", "amount", "receiptTotal", "expenseDate", "receiptImageUrl", "docType", "promptpayId", "status", "departmentId", "submitterId") VALUES
  ('claim-welfare-2', 'ค่าน้ำดื่มสิงห์และน้ำแข็งถังใหญ่', 'Makro สาขาสามย่าน', 1200, 1450, NOW() - INTERVAL '1 day', '/sample-receipts/makro-mixed-bill.svg', 'TAX_INVOICE', '0812345678', 'PENDING', 'dept-welfare', 'demo-staff-id')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ClaimItem" ("id", "claimId", "name", "quantity", "unitPrice", "totalPrice", "isClaimed") VALUES
  ('item-w2-1', 'claim-welfare-2', 'น้ำดื่มตราสิงห์ 600ml (แพ็ค 12 ขวด)', 20, 50, 1000, true),
  ('item-w2-2', 'claim-welfare-2', 'น้ำแข็งหลอดบริสุทธิ์ 5 กระสอบ', 5, 40, 200, true),
  ('item-w2-3', 'claim-welfare-2', 'ขนมขบเคี้ยวส่วนตัว (ไม่เบิก)', 5, 50, 250, false)
ON CONFLICT ("id") DO NOTHING;

-- 3.3 Logistics: PAID 8,000
INSERT INTO "Claim" ("id", "title", "merchantName", "amount", "receiptTotal", "expenseDate", "receiptImageUrl", "docType", "promptpayId", "status", "departmentId", "submitterId", "reviewerId", "paidAt") VALUES
  ('claim-logistics-1', 'ค่าเช่าชุดเครื่องเสียงและไมค์ไร้สาย', 'บจก. สยามซาวด์ แอนด์ ไลท์ติ้ง', 8000, 8000, NOW() - INTERVAL '5 days', '/sample-receipts/kplus-slip.svg', 'BANK_SLIP', '0812345678', 'PAID', 'dept-logistics', 'demo-staff-id', 'demo-treasurer-id', NOW() - INTERVAL '4 days')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ClaimItem" ("id", "claimId", "name", "quantity", "unitPrice", "totalPrice", "isClaimed") VALUES
  ('item-l1-1', 'claim-logistics-1', 'มัดจำเช่าระบบเสียง PA 3 วัน 2 คืน', 1, 8000, 8000, true)
ON CONFLICT ("id") DO NOTHING;

-- 3.4 Logistics: APPROVED 2,450
INSERT INTO "Claim" ("id", "title", "merchantName", "amount", "receiptTotal", "expenseDate", "receiptImageUrl", "docType", "promptpayId", "status", "departmentId", "submitterId", "reviewerId") VALUES
  ('claim-logistics-2', 'ซื้ออุปกรณ์ฮาร์ดแวร์ ปลั๊กพ่วง และสายไฟสนาม', 'ไทวัสดุ สาขาพระราม 4', 2450, 2450, NOW() - INTERVAL '1 day', '/sample-receipts/makro-mixed-bill.svg', 'TAX_INVOICE', '0812345678', 'APPROVED', 'dept-logistics', 'demo-staff-id', 'demo-treasurer-id')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ClaimItem" ("id", "claimId", "name", "quantity", "unitPrice", "totalPrice", "isClaimed") VALUES
  ('item-l2-1', 'claim-logistics-2', 'ปลั๊กพ่วงกันไฟกระชาก 5 ช่อง 5 เมตร', 3, 450, 1350, true),
  ('item-l2-2', 'claim-logistics-2', 'เทปพันสายไฟ 3M สีดำ', 10, 30, 300, true),
  ('item-l2-3', 'claim-logistics-2', 'สายไฟ VCT 2x2.5 ยาว 20 เมตร', 1, 800, 800, true)
ON CONFLICT ("id") DO NOTHING;

-- 3.5 Activities: PENDING 890 & REJECTED 1,500
INSERT INTO "Claim" ("id", "title", "merchantName", "amount", "receiptTotal", "expenseDate", "receiptImageUrl", "docType", "promptpayId", "status", "departmentId", "submitterId") VALUES
  ('claim-act-1', 'ค่าพร็อพทำกิจกรรมและลูกโป่งเกมฐาน', 'ร้านสมบูรณ์พาณิชย์เครื่องเขียน', 890, 890, NOW(), '/sample-receipts/handwritten-bill.svg', 'CASH_RECEIPT', '0812345678', 'PENDING', 'dept-activities', 'demo-staff-id')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ClaimItem" ("id", "claimId", "name", "quantity", "unitPrice", "totalPrice", "isClaimed") VALUES
  ('item-a1-1', 'claim-act-1', 'ลูกโป่งหนาหลากสี 100 ลูก', 3, 120, 360, true),
  ('item-a1-2', 'claim-act-1', 'เชือกฟางม้วนใหญ่', 4, 45, 180, true),
  ('item-a1-3', 'claim-act-1', 'ปากกาเคมีตราม้า 2 หัว 1 โหล', 1, 350, 350, true)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Claim" ("id", "title", "merchantName", "amount", "receiptTotal", "expenseDate", "receiptImageUrl", "docType", "promptpayId", "status", "departmentId", "submitterId", "reviewerId", "rejectReason") VALUES
  ('claim-act-2', 'ซื้อของรางวัลสำหรับเกมรอบกองไฟ', 'ร้านคละของเล่น', 1500, 1500, NOW() - INTERVAL '4 days', '/sample-receipts/kplus-slip.svg', 'BANK_SLIP', '0812345678', 'REJECTED', 'dept-activities', 'demo-staff-id', 'demo-treasurer-id', 'แนบมาเฉพาะสลิปโอนเงิน รบกวนถ่ายรูปใบเสร็จร้านค้าแนบมาใหม่ครับ')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ClaimItem" ("id", "claimId", "name", "quantity", "unitPrice", "totalPrice", "isClaimed") VALUES
  ('item-a2-1', 'claim-act-2', 'ตุ๊กตาของขวัญและพวงกุญแจรางวัล', 10, 150, 1500, true)
ON CONFLICT ("id") DO NOTHING;

-- 3.6 Medical: PAID 1,100
INSERT INTO "Claim" ("id", "title", "merchantName", "amount", "receiptTotal", "expenseDate", "receiptImageUrl", "docType", "promptpayId", "status", "departmentId", "submitterId", "reviewerId", "paidAt") VALUES
  ('claim-med-1', 'ค่ายาสามัญประจำบ้านและชุดปฐมพยาบาล', 'องค์การเภสัชกรรม สาขาจุฬาฯ', 1100, 1100, NOW() - INTERVAL '6 days', '/sample-receipts/makro-mixed-bill.svg', 'TAX_INVOICE', '0812345678', 'PAID', 'dept-medical', 'demo-staff-id', 'demo-treasurer-id', NOW() - INTERVAL '5 days')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ClaimItem" ("id", "claimId", "name", "quantity", "unitPrice", "totalPrice", "isClaimed") VALUES
  ('item-m1-1', 'claim-med-1', 'พาราเซตามอล 500mg (10 แผง)', 5, 80, 400, true),
  ('item-m1-2', 'claim-med-1', 'ยาใส่แผลเบตาดีน 30ml', 3, 50, 150, true),
  ('item-m1-3', 'claim-med-1', 'ผ้าก๊อซและเทปทำแผล Micropore', 4, 70, 280, true),
  ('item-m1-4', 'claim-med-1', 'แอมโมเนียและยาหม่อง', 3, 90, 270, true)
ON CONFLICT ("id") DO NOTHING;
