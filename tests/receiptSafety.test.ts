import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canGenerateReceipt } from "../lib/utils/receiptSafety";

describe("canGenerateReceipt", () => {
  it("rejects PENDING payments", () => {
    assert.equal(canGenerateReceipt({ paymentStatus: "PENDING", razorpayCaptured: true, signatureVerified: true, razorpayPaymentId: "pay_1" }), false);
  });

  it("rejects INITIATED payments", () => {
    assert.equal(canGenerateReceipt({ paymentStatus: "INITIATED", razorpayCaptured: true, signatureVerified: true, razorpayPaymentId: "pay_1" }), false);
  });

  it("rejects FAILED payments", () => {
    assert.equal(canGenerateReceipt({ paymentStatus: "FAILED", razorpayCaptured: true, signatureVerified: true, razorpayPaymentId: "pay_1" }), false);
  });

  it("allows captured SUCCESS payments with a verified signature", () => {
    assert.equal(canGenerateReceipt({ paymentStatus: "SUCCESS", razorpayCaptured: true, signatureVerified: true, razorpayPaymentId: "pay_1" }), true);
  });
});

