import crypto from "crypto";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";

export const PhonePeService = {
  async getConfig() {
    const settings = await templeSettingsRepository.getCurrentOrDefault();
    return {
      merchantId: process.env.PHONEPE_MERCHANT_ID || settings.phonepeMerchantId,
      saltKey: process.env.PHONEPE_CLIENT_SECRET || settings.phonepeClientSecret,
      saltIndex: process.env.PHONEPE_CLIENT_VERSION || settings.phonepeClientVersion || "1",
      env: process.env.NODE_ENV === "production" ? "PROD" : "UAT",
      redirectUrl: process.env.PHONEPE_REDIRECT_URL || settings.phonepeRedirectUrl || "/donate/success",
      callbackUrl: process.env.PHONEPE_CALLBACK_URL || settings.phonepeCallbackUrl || "/api/payments/callback"
    };
  },

  async createOrder(params: { merchantTransactionId: string, amount: number, userInfo?: any }) {
    const config = await this.getConfig();
    
    // Resolve absolute URLs if they are relative
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const redirectUrl = config.redirectUrl.startsWith('http') ? config.redirectUrl : `${baseUrl}${config.redirectUrl}`;
    const callbackUrl = config.callbackUrl.startsWith('http') ? config.callbackUrl : `${baseUrl}${config.callbackUrl}`;
    
    if (!config.merchantId || !config.saltKey) {
      // Mock mode
      return { success: true, redirectUrl: `${redirectUrl}?txnId=${params.merchantTransactionId}`, merchantTransactionId: params.merchantTransactionId };
    }

    const payload = {
      merchantId: config.merchantId,
      merchantTransactionId: params.merchantTransactionId,
      merchantUserId: params.userInfo?.mobile || "MUID123",
      amount: params.amount * 100, // in paise
      redirectUrl: redirectUrl,
      redirectMode: "REDIRECT",
      callbackUrl: callbackUrl,
      mobileNumber: params.userInfo?.mobile,
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    const base64EncodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const stringToSign = base64EncodedPayload + "/pg/v1/pay" + config.saltKey;
    const sha256 = crypto.createHash("sha256").update(stringToSign).digest("hex");
    const checksum = sha256 + "###" + config.saltIndex;

    const host = config.env === "PROD" ? "https://api.phonepe.com/apis/hermes" : "https://api-preprod.phonepe.com/apis/pg-sandbox";

    try {
      const response = await fetch(`${host}/pg/v1/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum
        },
        body: JSON.stringify({ request: base64EncodedPayload })
      });

      const data = await response.json();
      if (data.success && data.data && data.data.instrumentResponse && data.data.instrumentResponse.redirectInfo) {
        return { success: true, redirectUrl: data.data.instrumentResponse.redirectInfo.url, merchantTransactionId: params.merchantTransactionId };
      }
      return { success: false, redirectUrl: null, merchantTransactionId: params.merchantTransactionId };
    } catch {
      return { success: false, redirectUrl: null, merchantTransactionId: params.merchantTransactionId };
    }
  },

  async verifyPayment(merchantTransactionId: string) {
    const config = await this.getConfig();
    if (!config.merchantId || !config.saltKey) {
      return { success: true, paymentStatus: 'SUCCESS', transactionId: merchantTransactionId };
    }

    const stringToSign = `/pg/v1/status/${config.merchantId}/${merchantTransactionId}` + config.saltKey;
    const sha256 = crypto.createHash("sha256").update(stringToSign).digest("hex");
    const checksum = sha256 + "###" + config.saltIndex;

    const host = config.env === "PROD" ? "https://api.phonepe.com/apis/hermes" : "https://api-preprod.phonepe.com/apis/pg-sandbox";

    try {
      const response = await fetch(`${host}/pg/v1/status/${config.merchantId}/${merchantTransactionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-MERCHANT-ID": config.merchantId,
          "X-VERIFY": checksum
        }
      });
      const data = await response.json();
      if (data.success && data.code === "PAYMENT_SUCCESS") {
         return { success: true, paymentStatus: 'SUCCESS', transactionId: data.data.transactionId };
      }
      return { success: false, paymentStatus: 'FAILED', transactionId: data.data?.transactionId };
    } catch {
      return { success: false, paymentStatus: 'PENDING', transactionId: null };
    }
  },

  async validateCallback(bodyBase64: string, xVerify: string) {
    const config = await this.getConfig();
    if (!config.merchantId || !config.saltKey) return true;

    const stringToSign = bodyBase64 + config.saltKey;
    const sha256 = crypto.createHash("sha256").update(stringToSign).digest("hex");
    const expectedChecksum = sha256 + "###" + config.saltIndex;

    return xVerify === expectedChecksum;
  }
};
