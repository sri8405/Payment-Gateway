import crypto from "crypto";
import Razorpay from "razorpay";

const getConfig = () => ({
  keyId: process.env.RAZORPAY_KEY_ID || "",
  keySecret: process.env.RAZORPAY_KEY_SECRET || "",
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
});

function getClient() {
  const { keyId, keySecret } = getConfig();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      
      // Do not retry client-side errors like 401 Unauthorized or 400 Bad Request
      if (error?.statusCode === 401 || error?.statusCode === 400) {
        throw error;
      }

      const backoffMs = Math.min(500 * Math.pow(2, attempt - 1), 5000);
      if (process.env.NODE_ENV !== "production") {
        console.warn(`Razorpay API call failed, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})...`, error?.message);
      }
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}


export const RazorpayService = {
  async createOrder(
    amountInPaise: number,
    currency: string = "INR",
    receipt: string
  ): Promise<{ orderId: string; amount: number; currency: string }> {
    if (amountInPaise < 100) {
      throw new Error("Amount must be at least 100 paise (Rs 1)");
    }

    const rzp = getClient();

    try {
      const data = await withRetry(() => rzp.orders.create({
        amount: amountInPaise,
        currency,
        receipt,
      }));

      return {
        orderId: data.id,
        amount: Number(data.amount),
        currency: data.currency,
      };
    } catch (error: any) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Razorpay create order failed", {
          statusCode: error?.statusCode,
          code: error?.error?.code,
          description: error?.error?.description,
          reason: error?.error?.reason,
          field: error?.error?.field,
          message: error?.message,
        });
      }

      if (error?.statusCode === 401 || error?.error?.description?.toLowerCase().includes("authentication")) {
        throw new Error(
          `Razorpay authentication failed - the API key pair is invalid or has been regenerated. ` +
          `Go to Razorpay Dashboard -> Settings -> API Keys, generate a new Test Key, and update ` +
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

  async fetchOrder(orderId: string) {
    return withRetry(() => getClient().orders.fetch(orderId));
  },

  async fetchOrderPayments(orderId: string) {
    return withRetry(() => getClient().orders.fetchPayments(orderId));
  },

  async fetchPayment(paymentId: string) {
    return withRetry(() => getClient().payments.fetch(paymentId));
  },

  async refundPayment(paymentId: string, amountInPaise: number, notes: Record<string, string>) {
    return withRetry(() => getClient().payments.refund(paymentId, {
      amount: amountInPaise,
      notes,
    }));
  },

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
      return false;
    }
  },

  validateWebhook(rawBody: string, signature: string): boolean {
    const { webhookSecret } = getConfig();
    if (!webhookSecret) return false;

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
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
