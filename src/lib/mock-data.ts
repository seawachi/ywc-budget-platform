import { ClaimWithRelations, DepartmentBudgetSummary } from "@/types/receipt";

export interface DemoStore {
  currentRole: "STAFF" | "TREASURER";
  departments: Array<{
    id: string;
    name: string;
    color: string;
    allocatedBudget: number;
  }>;
  claims: ClaimWithRelations[];
}

const initialDepartments = [
  {
    id: "dept-welfare",
    name: "ฝ่ายสวัสดิการ",
    color: "#10B981", // Emerald
    allocatedBudget: 20000,
  },
  {
    id: "dept-logistics",
    name: "ฝ่ายพัสดุและสถานที่",
    color: "#3B82F6", // Blue
    allocatedBudget: 15000,
  },
  {
    id: "dept-activities",
    name: "ฝ่ายกิจกรรมและสันทนาการ",
    color: "#F59E0B", // Amber
    allocatedBudget: 10000,
  },
  {
    id: "dept-medical",
    name: "ฝ่ายพยาบาลและประสานงาน",
    color: "#EC4899", // Pink
    allocatedBudget: 5000,
  },
];

const initialClaims: ClaimWithRelations[] = [
  // 1. ฝ่ายสวัสดิการ
  {
    id: "claim-welfare-1",
    title: "ค่าข้าวกล่องมื้อกลางวัน วันเตรียมค่าย",
    merchantName: "ร้านป้าสมใจ อาหารตามสั่ง",
    amount: 6500,
    receiptTotal: 6500,
    expenseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    receiptImageUrl: "/sample-receipts/handwritten-bill.svg",
    docType: "CASH_RECEIPT",
    promptpayId: "0812345678",
    status: "PAID",
    paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    rejectReason: null,
    payoutSlipUrl: "/sample-receipts/kplus-slip.svg",
    departmentId: "dept-welfare",
    submitterId: "demo-staff-id",
    reviewerId: "demo-treasurer-id",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    department: initialDepartments[0],
    submitter: {
      id: "demo-staff-id",
      name: "สมชาย หมายมั่น (Staff ฝ่ายสวัสดิการ)",
      email: "staff@larngear.camp",
      promptpayId: "0812345678",
    },
    reviewer: {
      id: "demo-treasurer-id",
      name: "สมหญิง รอบคอบ (Treasurer ค่าย)",
    },
    items: [
      { name: "ข้าวกล่องหมูกรอบไข่ดาว 100 กล่อง", quantity: 100, unitPrice: 60, totalPrice: 6000, isClaimed: true },
      { name: "น้ำซุปกระดูกหมูหม้อใหญ่", quantity: 1, unitPrice: 500, totalPrice: 500, isClaimed: true },
    ],
  },
  {
    id: "claim-welfare-2",
    title: "ค่าน้ำดื่มสิงห์และน้ำแข็งถังใหญ่",
    merchantName: "Makro สาขาสามย่าน",
    amount: 1200,
    receiptTotal: 1450,
    expenseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    receiptImageUrl: "/sample-receipts/makro-mixed-bill.svg",
    docType: "TAX_INVOICE",
    promptpayId: "0812345678",
    status: "PENDING",
    paidAt: null,
    rejectReason: null,
    payoutSlipUrl: null,
    departmentId: "dept-welfare",
    submitterId: "demo-staff-id",
    reviewerId: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    department: initialDepartments[0],
    submitter: {
      id: "demo-staff-id",
      name: "สมชาย หมายมั่น (Staff ฝ่ายสวัสดิการ)",
      email: "staff@larngear.camp",
      promptpayId: "0812345678",
    },
    reviewer: null,
    items: [
      { name: "น้ำดื่มตราสิงห์ 600ml (แพ็ค 12 ขวด)", quantity: 20, unitPrice: 50, totalPrice: 1000, isClaimed: true },
      { name: "น้ำแข็งหลอดบริสุทธิ์ 5 กระสอบ", quantity: 5, unitPrice: 40, totalPrice: 200, isClaimed: true },
      { name: "ขนมขบเคี้ยวส่วนตัว (ไม่เบิก)", quantity: 5, unitPrice: 50, totalPrice: 250, isClaimed: false },
    ],
  },
  // 2. ฝ่ายพัสดุและสถานที่
  {
    id: "claim-logistics-1",
    title: "ค่าเช่าชุดเครื่องเสียงและไมค์ไร้สาย",
    merchantName: "บจก. สยามซาวด์ แอนด์ ไลท์ติ้ง",
    amount: 8000,
    receiptTotal: 8000,
    expenseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    receiptImageUrl: "/sample-receipts/kplus-slip.svg",
    docType: "BANK_SLIP",
    promptpayId: "0812345678",
    status: "PAID",
    paidAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    rejectReason: null,
    payoutSlipUrl: "/sample-receipts/kplus-slip.svg",
    departmentId: "dept-logistics",
    submitterId: "demo-staff-id",
    reviewerId: "demo-treasurer-id",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    department: initialDepartments[1],
    submitter: {
      id: "demo-staff-id",
      name: "สมชาย หมายมั่น (Staff ฝ่ายสวัสดิการ)",
      email: "staff@larngear.camp",
      promptpayId: "0812345678",
    },
    reviewer: {
      id: "demo-treasurer-id",
      name: "สมหญิง รอบคอบ (Treasurer ค่าย)",
    },
    items: [
      { name: "มัดจำเช่าระบบเสียง PA 3 วัน 2 คืน", quantity: 1, unitPrice: 8000, totalPrice: 8000, isClaimed: true },
    ],
  },
  {
    id: "claim-logistics-2",
    title: "ซื้ออุปกรณ์ฮาร์ดแวร์ ปลั๊กพ่วง และสายไฟสนาม",
    merchantName: "ไทวัสดุ สาขาพระราม 4",
    amount: 2450,
    receiptTotal: 2450,
    expenseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    receiptImageUrl: "/sample-receipts/makro-mixed-bill.svg",
    docType: "TAX_INVOICE",
    promptpayId: "0812345678",
    status: "APPROVED",
    paidAt: null,
    rejectReason: null,
    payoutSlipUrl: null,
    departmentId: "dept-logistics",
    submitterId: "demo-staff-id",
    reviewerId: "demo-treasurer-id",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    department: initialDepartments[1],
    submitter: {
      id: "demo-staff-id",
      name: "สมชาย หมายมั่น (Staff ฝ่ายสวัสดิการ)",
      email: "staff@larngear.camp",
      promptpayId: "0812345678",
    },
    reviewer: {
      id: "demo-treasurer-id",
      name: "สมหญิง รอบคอบ (Treasurer ค่าย)",
    },
    items: [
      { name: "ปลั๊กพ่วงกันไฟกระชาก 5 ช่อง 5 เมตร", quantity: 3, unitPrice: 450, totalPrice: 1350, isClaimed: true },
      { name: "เทปพันสายไฟ 3M สีดำ", quantity: 10, unitPrice: 30, totalPrice: 300, isClaimed: true },
      { name: "สายไฟ VCT 2x2.5 ยาว 20 เมตร", quantity: 1, unitPrice: 800, totalPrice: 800, isClaimed: true },
    ],
  },
  // 3. ฝ่ายกิจกรรมและสันทนาการ
  {
    id: "claim-act-1",
    title: "ค่าพร็อพทำกิจกรรมและลูกโป่งเกมฐาน",
    merchantName: "ร้านสมบูรณ์พาณิชย์เครื่องเขียน",
    amount: 890,
    receiptTotal: 890,
    expenseDate: new Date().toISOString(),
    receiptImageUrl: "/sample-receipts/handwritten-bill.svg",
    docType: "CASH_RECEIPT",
    promptpayId: "0812345678",
    status: "PENDING",
    paidAt: null,
    rejectReason: null,
    payoutSlipUrl: null,
    departmentId: "dept-activities",
    submitterId: "demo-staff-id",
    reviewerId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    department: initialDepartments[2],
    submitter: {
      id: "demo-staff-id",
      name: "สมชาย หมายมั่น (Staff ฝ่ายสวัสดิการ)",
      email: "staff@larngear.camp",
      promptpayId: "0812345678",
    },
    reviewer: null,
    items: [
      { name: "ลูกโป่งหนาหลากสี 100 ลูก", quantity: 3, unitPrice: 120, totalPrice: 360, isClaimed: true },
      { name: "เชือกฟางม้วนใหญ่", quantity: 4, unitPrice: 45, totalPrice: 180, isClaimed: true },
      { name: "ปากกาเคมีตราม้า 2 หัว 1 โหล", quantity: 1, unitPrice: 350, totalPrice: 350, isClaimed: true },
    ],
  },
  {
    id: "claim-act-2",
    title: "ซื้อของรางวัลสำหรับเกมรอบกองไฟ",
    merchantName: "ร้านคละของเล่น",
    amount: 1500,
    receiptTotal: 1500,
    expenseDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    receiptImageUrl: "/sample-receipts/kplus-slip.svg",
    docType: "BANK_SLIP",
    promptpayId: "0812345678",
    status: "REJECTED",
    paidAt: null,
    rejectReason: "แนบมาเฉพาะสลิปโอนเงิน รบกวนถ่ายรูปใบเสร็จร้านค้าแนบมาใหม่ครับ",
    payoutSlipUrl: null,
    departmentId: "dept-activities",
    submitterId: "demo-staff-id",
    reviewerId: "demo-treasurer-id",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    department: initialDepartments[2],
    submitter: {
      id: "demo-staff-id",
      name: "สมชาย หมายมั่น (Staff ฝ่ายสวัสดิการ)",
      email: "staff@larngear.camp",
      promptpayId: "0812345678",
    },
    reviewer: {
      id: "demo-treasurer-id",
      name: "สมหญิง รอบคอบ (Treasurer ค่าย)",
    },
    items: [
      { name: "ตุ๊กตาของขวัญและพวงกุญแจรางวัล", quantity: 10, unitPrice: 150, totalPrice: 1500, isClaimed: true },
    ],
  },
  // 4. ฝ่ายพยาบาลและประสานงาน
  {
    id: "claim-med-1",
    title: "ค่ายาสามัญประจำบ้านและชุดปฐมพยาบาล",
    merchantName: "องค์การเภสัชกรรม สาขาจุฬาฯ",
    amount: 1100,
    receiptTotal: 1100,
    expenseDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    receiptImageUrl: "/sample-receipts/makro-mixed-bill.svg",
    docType: "TAX_INVOICE",
    promptpayId: "0812345678",
    status: "PAID",
    paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    rejectReason: null,
    payoutSlipUrl: "/sample-receipts/kplus-slip.svg",
    departmentId: "dept-medical",
    submitterId: "demo-staff-id",
    reviewerId: "demo-treasurer-id",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    department: initialDepartments[3],
    submitter: {
      id: "demo-staff-id",
      name: "สมชาย หมายมั่น (Staff ฝ่ายสวัสดิการ)",
      email: "staff@larngear.camp",
      promptpayId: "0812345678",
    },
    reviewer: {
      id: "demo-treasurer-id",
      name: "สมหญิง รอบคอบ (Treasurer ค่าย)",
    },
    items: [
      { name: "พาราเซตามอล 500mg (10 แผง)", quantity: 5, unitPrice: 80, totalPrice: 400, isClaimed: true },
      { name: "ยาใส่แผลเบตาดีน 30ml", quantity: 3, unitPrice: 50, totalPrice: 150, isClaimed: true },
      { name: "ผ้าก๊อซและเทปทำแผล Micropore", quantity: 4, unitPrice: 70, totalPrice: 280, isClaimed: true },
      { name: "แอมโมเนียและยาหม่อง", quantity: 3, unitPrice: 90, totalPrice: 270, isClaimed: true },
    ],
  },
];

// In-Memory store singleton
const globalStore = globalThis as unknown as {
  __demoStore?: DemoStore;
};

export function getDemoStore(): DemoStore {
  if (!globalStore.__demoStore) {
    globalStore.__demoStore = {
      currentRole: "STAFF",
      departments: JSON.parse(JSON.stringify(initialDepartments)),
      claims: JSON.parse(JSON.stringify(initialClaims)),
    };
  }
  return globalStore.__demoStore;
}

export function resetDemoStore(): void {
  globalStore.__demoStore = {
    currentRole: "STAFF",
    departments: JSON.parse(JSON.stringify(initialDepartments)),
    claims: JSON.parse(JSON.stringify(initialClaims)),
  };
}

export function calculateDashboardMetrics(claims: ClaimWithRelations[], departments: typeof initialDepartments): {
  totalAllocated: number;
  actualDisbursed: number;
  pendingReserved: number;
  availableBalance: number;
  departmentSummaries: DepartmentBudgetSummary[];
} {
  const totalAllocated = departments.reduce((acc, d) => acc + d.allocatedBudget, 0);

  let actualDisbursed = 0;
  let pendingReserved = 0;

  const departmentSummaries: DepartmentBudgetSummary[] = departments.map((dept) => {
    const deptClaims = claims.filter((c) => c.departmentId === dept.id);
    const spent = deptClaims
      .filter((c) => c.status === "PAID")
      .reduce((acc, c) => acc + c.amount, 0);
    const reserved = deptClaims
      .filter((c) => c.status === "PENDING" || c.status === "APPROVED")
      .reduce((acc, c) => acc + c.amount, 0);
    const available = Math.max(0, dept.allocatedBudget - spent - reserved);
    const usagePercent = Math.min(100, Math.round(((spent + reserved) / dept.allocatedBudget) * 100));

    actualDisbursed += spent;
    pendingReserved += reserved;

    return {
      id: dept.id,
      name: dept.name,
      color: dept.color,
      allocatedBudget: dept.allocatedBudget,
      spent,
      reserved,
      available,
      usagePercent,
    };
  });

  const availableBalance = Math.max(0, totalAllocated - actualDisbursed - pendingReserved);

  return {
    totalAllocated,
    actualDisbursed,
    pendingReserved,
    availableBalance,
    departmentSummaries,
  };
}
