import { Role, ClaimStatus, DocType } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth-crypto";

async function main() {
  console.log("🌱 Starting database seeding with Workspaces and Real Auth...");

  // Clean existing data
  await prisma.claimItem.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.department.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  // Create Users with real hashed passwords ("password123")
  const defaultPasswordHash = hashPassword("password123");

  const staff = await prisma.user.create({
    data: {
      id: "demo-staff-id",
      email: "staff@larngear.camp",
      passwordHash: defaultPasswordHash,
      name: "สมชาย หมายมั่น (Staff ฝ่ายสวัสดิการ)",
      role: Role.STAFF,
      promptpayId: "0812345678",
    },
  });

  const treasurer = await prisma.user.create({
    data: {
      id: "demo-treasurer-id",
      email: "treasurer@larngear.camp",
      passwordHash: defaultPasswordHash,
      name: "สมหญิง รอบคอบ (Treasurer ค่าย)",
      role: Role.TREASURER,
      promptpayId: "0898765432",
    },
  });

  // Create Primary Workspace: Larngear Camp 2026
  const primaryWorkspace = await prisma.workspace.create({
    data: {
      id: "workspace-larngear-2026",
      name: "ค่ายลานเกียร์ 2026 (Larngear Camp)",
      code: "LG-2026",
      description: "ค่ายวิศวะพัฒนาน้องเพื่อเยาวชน ปีการศึกษา 2569",
      totalBudget: 50000,
      ownerId: treasurer.id,
      members: {
        create: [
          { userId: treasurer.id, role: Role.TREASURER },
          { userId: staff.id, role: Role.STAFF },
        ],
      },
    },
  });

  // Create Secondary Workspace to demonstrate multi-workspace switching: Youth Tech Camp
  const secondaryWorkspace = await prisma.workspace.create({
    data: {
      id: "workspace-youth-tech-2026",
      name: "ค่ายสู่ฝัน Tech Camp 2026",
      code: "TC-2026",
      description: "ค่ายสอนเขียนโค้ดและพัฒนา AI สู่รั้วมหาวิทยาลัย",
      totalBudget: 80000,
      ownerId: treasurer.id,
      members: {
        create: [
          { userId: treasurer.id, role: Role.TREASURER },
          { userId: staff.id, role: Role.STAFF },
        ],
      },
    },
  });

  // Create Departments for Primary Workspace
  const welfare = await prisma.department.create({
    data: {
      id: "dept-welfare",
      workspaceId: primaryWorkspace.id,
      name: "ฝ่ายสวัสดิการ",
      color: "#10B981", // Emerald green
      allocatedBudget: 20000,
    },
  });

  const logistics = await prisma.department.create({
    data: {
      id: "dept-logistics",
      workspaceId: primaryWorkspace.id,
      name: "ฝ่ายพัสดุและสถานที่",
      color: "#3B82F6", // Blue
      allocatedBudget: 15000,
    },
  });

  const activities = await prisma.department.create({
    data: {
      id: "dept-activities",
      workspaceId: primaryWorkspace.id,
      name: "ฝ่ายกิจกรรมและสันทนาการ",
      color: "#F59E0B", // Amber
      allocatedBudget: 10000,
    },
  });

  const medical = await prisma.department.create({
    data: {
      id: "dept-medical",
      workspaceId: primaryWorkspace.id,
      name: "ฝ่ายพยาบาลและประสานงาน",
      color: "#EC4899", // Pink
      allocatedBudget: 5000,
    },
  });

  // Create Departments for Secondary Workspace
  await prisma.department.create({
    data: {
      id: "dept-tc-academic",
      workspaceId: secondaryWorkspace.id,
      name: "ฝ่ายวิชาการและอบรม",
      color: "#8B5CF6",
      allocatedBudget: 40000,
    },
  });

  await prisma.department.create({
    data: {
      id: "dept-tc-facilities",
      workspaceId: secondaryWorkspace.id,
      name: "ฝ่ายสถานที่และอุปกรณ์คอมพิวเตอร์",
      color: "#06B6D4",
      allocatedBudget: 40000,
    },
  });

  // Create Claims for Primary Workspace
  // 1. ฝ่ายสวัสดิการ: PAID 6,500
  await prisma.claim.create({
    data: {
      id: "claim-welfare-1",
      workspaceId: primaryWorkspace.id,
      title: "ค่าข้าวกล่องมื้อกลางวัน วันเตรียมค่าย",
      merchantName: "ร้านป้าสมใจ อาหารตามสั่ง",
      amount: 6500,
      receiptTotal: 6500,
      expenseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      receiptImageUrl: "/sample-receipts/handwritten-bill.svg",
      docType: DocType.CASH_RECEIPT,
      promptpayId: "0812345678",
      status: ClaimStatus.PAID,
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      departmentId: welfare.id,
      submitterId: staff.id,
      reviewerId: treasurer.id,
      items: {
        create: [
          { name: "ข้าวกล่องหมูกรอบไข่ดาว 100 กล่อง", quantity: 100, unitPrice: 60, totalPrice: 6000, isClaimed: true },
          { name: "น้ำซุปกระดูกหมูหม้อใหญ่", quantity: 1, unitPrice: 500, totalPrice: 500, isClaimed: true },
        ],
      },
    },
  });

  // 2. ฝ่ายสวัสดิการ: PENDING 930
  await prisma.claim.create({
    data: {
      id: "claim-welfare-2",
      workspaceId: primaryWorkspace.id,
      title: "ซื้อของสดและของว่างเตรียมกิจกรรมรอบกองไฟ",
      merchantName: "Makro สาขาสามย่าน",
      amount: 930,
      receiptTotal: 1210,
      expenseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      receiptImageUrl: "/sample-receipts/makro-mixed-bill.svg",
      docType: DocType.TAX_INVOICE,
      promptpayId: "0812345678",
      status: ClaimStatus.PENDING,
      departmentId: welfare.id,
      submitterId: staff.id,
      items: {
        create: [
          { name: "ไส้กรอกไก่รมควัน 2 กก.", quantity: 2, unitPrice: 220, totalPrice: 440, isClaimed: true },
          { name: "มาม่าต้มยำกุ้งแพ็ค 30 ซอง", quantity: 1, unitPrice: 190, totalPrice: 190, isClaimed: true },
          { name: "น้ำอัดลม 1.5 ลิตร (6 ขวด)", quantity: 2, unitPrice: 150, totalPrice: 300, isClaimed: true },
          { name: "อาหารแมววิสกัส 1.2 กก. (ของส่วนตัวสต๊าฟ)", quantity: 1, unitPrice: 280, totalPrice: 280, isClaimed: false },
        ],
      },
    },
  });

  // 3. ฝ่ายพัสดุ: APPROVED 8,000 (รอจ่ายเงิน)
  await prisma.claim.create({
    data: {
      id: "claim-logistics-1",
      workspaceId: primaryWorkspace.id,
      title: "ค่าเช่าเครื่องเสียงและไฟเวทีกิจกรรม",
      merchantName: "ร้านดนตรีสยามซาวด์",
      amount: 8000,
      receiptTotal: 8000,
      expenseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      receiptImageUrl: "/sample-receipts/kplus-slip.svg",
      docType: DocType.BANK_SLIP,
      promptpayId: "0812345678",
      status: ClaimStatus.APPROVED,
      departmentId: logistics.id,
      submitterId: staff.id,
      reviewerId: treasurer.id,
      items: {
        create: [
          { name: "มัดจำเช่าชุดเครื่องเสียง 2 วัน", quantity: 1, unitPrice: 8000, totalPrice: 8000, isClaimed: true },
        ],
      },
    },
  });

  // 4. ฝ่ายกิจกรรม: PENDING 1,200
  await prisma.claim.create({
    data: {
      id: "claim-activities-1",
      workspaceId: primaryWorkspace.id,
      title: "ซื้อกระดาษชาร์ทและปากกาเคมี กิจกรรมกลุ่มสัมพันธ์",
      merchantName: "สมใจ เครื่องเขียน",
      amount: 1200,
      receiptTotal: 1200,
      expenseDate: new Date(),
      receiptImageUrl: "/sample-receipts/handwritten-bill.svg",
      docType: DocType.CASH_RECEIPT,
      promptpayId: "0812345678",
      status: ClaimStatus.PENDING,
      departmentId: activities.id,
      submitterId: staff.id,
      items: {
        create: [
          { name: "กระดาษชาร์ทสีขาว 50 แผ่น", quantity: 50, unitPrice: 10, totalPrice: 500, isClaimed: true },
          { name: "ปากกาเคมี 2 หัว (กล่อง 12 ด้าม)", quantity: 2, unitPrice: 250, totalPrice: 500, isClaimed: true },
          { name: "เทปกาว 2 หน้า 4 ม้วน", quantity: 4, unitPrice: 50, totalPrice: 200, isClaimed: true },
        ],
      },
    },
  });

  // 5. ฝ่ายพยาบาล: PAID 1,980
  await prisma.claim.create({
    data: {
      id: "claim-medical-1",
      workspaceId: primaryWorkspace.id,
      title: "ชุดยาสามัญประจำค่ายและเวชภัณฑ์ปฐมพยาบาล",
      merchantName: "ร้านขายยาศิริราชฟาร์มาซี",
      amount: 1980,
      receiptTotal: 1980,
      expenseDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      receiptImageUrl: "/sample-receipts/makro-mixed-bill.svg",
      docType: DocType.TAX_INVOICE,
      promptpayId: "0812345678",
      status: ClaimStatus.PAID,
      paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      departmentId: medical.id,
      submitterId: staff.id,
      reviewerId: treasurer.id,
      items: {
        create: [
          { name: "พาราเซตามอล 500 มก. 10 แผง", quantity: 10, unitPrice: 20, totalPrice: 200, isClaimed: true },
          { name: "พลาสเตอร์ปิดแผล 100 ชิ้น", quantity: 2, unitPrice: 140, totalPrice: 280, isClaimed: true },
          { name: "แอลกอฮอล์ล้างแผล 450 มล.", quantity: 5, unitPrice: 60, totalPrice: 300, isClaimed: true },
          { name: "ผงเกลือแร่ ORS 50 ซอง", quantity: 50, unitPrice: 8, totalPrice: 400, isClaimed: true },
          { name: "เบตาดีน 30 มล.", quantity: 4, unitPrice: 100, totalPrice: 400, isClaimed: true },
          { name: "ผ้าก๊อซพันแผล 10 ม้วน", quantity: 10, unitPrice: 40, totalPrice: 400, isClaimed: true },
        ],
      },
    },
  });

  console.log("✅ Seed completed successfully with Workspaces!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
