import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn("⚠️ Warning: RESEND_API_KEY is not defined in environment variables.");
}

export const resend = new Resend(resendApiKey || "re_dummy_key_for_initialization");
