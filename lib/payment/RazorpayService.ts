import crypto from "crypto";
import Razorpay from "razorpay";

const getConfig = () => ({
  keyId: process.env.RAZORPAY_KEY_ID || "",
  keySecret: process.env.RAZORPAY_KEY_SECRET || "",
});

// Step 1: Startup log check for environment variables
if (typeof window === "undefined") {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const publicId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  console.log("=== [Razorpay Config Verification] ===");
  if (keyId) {
    console.log("✅ RAZORPAY_KEY_ID is present.");
  } else {
    console.warn("⚠️ Warning: RAZORPAY_KEY_ID environment variable is missing!");
  }

  if (keySecret) {
    console.log("✅ RAZORPAY_KEY_SECRET is present.");
  } else {
    console.warn("⚠️ Warning: RAZORPAY_KEY_SECRET environment variable is missing!");
  }

  if (publicId) {
    console.log("✅ NEXT_PUBLIC_RAZORPAY_KEY_ID is present.");
  } else {
    console.warn("⚠️ Warning: NEXT_PUBLIC_RAZORPAY_KEY_ID environment variable is missing!");
  }

  if (keySecret && publicId === keySecret) {
    console.error("❌ SECURITY EXPOSURE: RAZORPAY_KEY_SECRET is exposed in NEXT_PUBLIC_RAZORPAY_KEY_ID!");
  }
  console.log("======================================");
}

export const RazorpayService = {
  /**
   * Create a Razorpay order via their REST API.
   * @param amountInPaise – must be >= 100
   * @param currency – default "INR"
   * @param receipt – a human-readable receipt identifier (e.g. donationId)
   */
  async createOrder(
    amountInPaise: number,
    currency: string = "INR",
    receipt: string
  ): Promise<{ orderId: string; amount: number; currency: string }> {
    if (amountInPaise < 100) {
      throw new Error("Amount must be at least 100 paise (₹1)");
    }

    const { keyId, keySecret } = getConfig();
    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials are not configured");
    }

    const rzp = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    try {
      const data = await rzp.orders.create({
        amount: amountInPaise,
        currency,
        receipt,
      });

      return {
        orderId: data.id,
        amount: Number(data.amount),
        currency: data.currency,
      };
    } catch (error: any) {
      // Log every field the Razorpay SDK exposes so the real cause is visible in server logs
      console.error("=== RAZORPAY CREATE ORDER FAILED ===");
      console.error("statusCode        :", error?.statusCode);
      console.error("error.code        :", error?.error?.code);
      console.error("error.description :", error?.error?.description);
      console.error("error.source      :", error?.error?.source);
      console.error("error.step        :", error?.error?.step);
      console.error("error.reason      :", error?.error?.reason);
      console.error("error.field       :", error?.error?.field);
      console.error("message           :", error?.message);
      console.error("Full error object :", JSON.stringify(error, null, 2));
      console.error("Stack             :", error?.stack);
      console.error("=====================================");

      if (error?.statusCode === 401 || error?.error?.description?.toLowerCase().includes("authentication")) {
        throw new Error(
          `Razorpay authentication failed – the API key pair is invalid or has been regenerated. ` +
          `Go to Razorpay Dashboard → Settings → API Keys, generate a new Test Key, and update ` +
          `RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env.local file. ` +
          `(Razorpay said: "${error?.error?.description ?? "Authentication failed"}")`
        );
      }

      throw new Error(
        `Razorpay API error [${error?.statusCode ?? "unknown"}]: ` +
        `${error?.error?.description ?? error?.message ?? "Unknown error"}`
      );
    }
  },

  /**
   * Verify the payment signature returned by Razorpay Checkout.
   *
   * Algorithm: HMAC-SHA256( orderId + "|" + paymentId , KEY_SECRET )
   * The generated signature must match `razorpaySignature`.
   */
  verifySignature(
    orderId: string,
    paymentId: string,
    razorpaySignature: string
  ): boolean {
    const { keySecret } = getConfig();
    if (!keySecret) {
      throw new Error("Razorpay KEY_SECRET is not configured");
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(razorpaySignature, "hex")
      );
    } catch {
      // timingSafeEqual throws if buffer lengths differ (malformed signature)
      return false;
    }
  },

  /**
   * Validate a Razorpay webhook payload using the X-Razorpay-Signature header.
   *
   * Algorithm: HMAC-SHA256( rawBody , WEBHOOK_SECRET )
   * For simplicity we reuse KEY_SECRET as the webhook secret.
   */
  validateWebhook(rawBody: string, signature: string): boolean {
    const { keySecret } = getConfig();
    if (!keySecret) return false;

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(rawBody)
      .digest("hex");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(signature, "hex")
      );
    } catch {
      return false;
    }
  },
};
