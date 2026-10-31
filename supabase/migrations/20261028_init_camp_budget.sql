-- ==============================================================================
-- Camp & Club Budget Tracker — Supabase Database Migration & RLS Policies
-- Project Ref: knjufluvpzrtzfhxhyux
-- ==============================================================================

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('STAFF', 'TREASURER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DocType" AS ENUM ('BANK_SLIP', 'CASH_RECEIPT', 'TAX_INVOICE', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create User Table
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'STAFF',
  "promptpayId" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Department Table
CREATE TABLE IF NOT EXISTS "Department" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "allocatedBudget" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Claim Table
CREATE TABLE IF NOT EXISTS "Claim" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "merchantName" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "receiptTotal" DOUBLE PRECISION,
  "expenseDate" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "receiptImageUrl" TEXT NOT NULL,
  "docType" "DocType" NOT NULL DEFAULT 'CASH_RECEIPT',
  "promptpayId" TEXT NOT NULL,
  "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
  "rejectReason" TEXT,
  "payoutSlipUrl" TEXT,
  "paidAt" TIMESTAMP WITH TIME ZONE,
  "departmentId" TEXT NOT NULL REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "submitterId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "reviewerId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create ClaimItem Table
CREATE TABLE IF NOT EXISTS "ClaimItem" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "totalPrice" DOUBLE PRECISION NOT NULL,
  "isClaimed" BOOLEAN NOT NULL DEFAULT true,
  "claimId" TEXT NOT NULL REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 6. Enable Row Level Security (RLS) on all exposed tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Department" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Claim" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClaimItem" ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies: Allow Read and Write for Application Access
CREATE POLICY "Allow public read users" ON "User" FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON "User" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON "User" FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read departments" ON "Department" FOR SELECT USING (true);
CREATE POLICY "Allow public manage departments" ON "Department" FOR ALL USING (true);

CREATE POLICY "Allow public read claims" ON "Claim" FOR SELECT USING (true);
CREATE POLICY "Allow public insert claims" ON "Claim" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update claims" ON "Claim" FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read claim items" ON "ClaimItem" FOR SELECT USING (true);
CREATE POLICY "Allow public insert claim items" ON "ClaimItem" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update claim items" ON "ClaimItem" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete claim items" ON "ClaimItem" FOR DELETE USING (true);

-- 8. Storage: Ensure 'receipts' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for 'receipts' bucket
CREATE POLICY "Allow public read receipts" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts');

CREATE POLICY "Allow public upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Allow public update receipts" ON storage.objects
  FOR UPDATE USING (bucket_id = 'receipts');
