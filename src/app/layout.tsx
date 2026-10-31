import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const promptFont = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Camp Budget Tracker — ระบบเบิกจ่ายงบค่ายด้วย AI",
  description: "เว็บแอปพลิเคชันบริหารจัดการงบประมาณและระบบเบิกจ่ายเงิน (Reimbursement) สำหรับค่ายและชมรม พร้อม AI Receipt Scanner และ Instant PromptPay Payout",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={promptFont.variable}>
      <body className={`min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white ${promptFont.className}`}>
        {children}
      </body>
    </html>
  );
}
