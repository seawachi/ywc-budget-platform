export function generatePromptPayPayload(target: string, amount: number): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const generatePayload = require("promptpay-qr");
    return generatePayload(target, { amount });
  } catch (err) {
    console.warn("Failed to generate EMVCo payload via promptpay-qr, using fallback:", err);
    // Minimal valid EMVCo payload format or dummy string for rendering
    return `00020101021229370016A00000067701011101130066${target.replace(/\D/g, "")}5303764540${amount.toFixed(2).length}${amount.toFixed(2)}5802TH6304`;
  }
}
