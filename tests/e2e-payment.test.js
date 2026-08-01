/**
 * GuruSeva End-to-End Payment Lifecycle & Webhook Order Simulation Test
 * Usage: node tests/e2e-payment.test.js
 */

const assert = require("assert");
const crypto = require("crypto");

console.log("🔄 Running End-to-End Payment Lifecycle Simulation...\n");

// Simulated Database Store
const mockDb = new Map();

function createDonation(id, amount) {
  const donation = {
    donationId: id,
    amount,
    status: "PENDING",
    paymentStatus: "PENDING",
    razorpayOrderId: `order_${id}`,
    receiptNumber: null,
  };
  mockDb.set(id, donation);
  return donation;
}

// Simulated Idempotent Payment Processor
function processPaymentSuccess(orderId, paymentId, source) {
  let targetDonation = null;
  for (const donation of mockDb.values()) {
    if (donation.razorpayOrderId === orderId) {
      targetDonation = donation;
      break;
    }
  }

  if (!targetDonation) {
    throw new Error("Donation order not found");
  }

  if (targetDonation.status === "VERIFIED" && targetDonation.receiptNumber) {
    console.log(`ℹ️ [Source: ${source}] Donation already VERIFIED. Returning existing receipt ${targetDonation.receiptNumber}.`);
    return targetDonation;
  }

  targetDonation.paymentStatus = "SUCCESS";
  targetDonation.status = "VERIFIED";
  targetDonation.razorpayPaymentId = paymentId;
  targetDonation.receiptNumber = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  console.log(`✅ [Source: ${source}] Payment marked SUCCESS. Generated Receipt: ${targetDonation.receiptNumber}`);
  return targetDonation;
}

// Test 1: Frontend Verification Arrives First, Webhook Arrives Second
createDonation("DON-E2E-1", 500);
const frontendRes = processPaymentSuccess("order_DON-E2E-1", "pay_FE_111", "Frontend API");
assert.strictEqual(frontendRes.status, "VERIFIED", "Status should be VERIFIED");
const receipt1 = frontendRes.receiptNumber;

const webhookRes = processPaymentSuccess("order_DON-E2E-1", "pay_FE_111", "Razorpay Webhook");
assert.strictEqual(webhookRes.receiptNumber, receipt1, "Webhook must return same receipt number without creating duplicate");

console.log("✅ E2E Test 1 Passed: Out-of-order execution (Frontend before Webhook) handled idempotently.\n");

// Test 2: Webhook Arrives First (Browser Closed), Frontend Verifies Second (User Returns)
createDonation("DON-E2E-2", 1000);
const webhookFirstRes = processPaymentSuccess("order_DON-E2E-2", "pay_WH_222", "Razorpay Webhook (Browser Closed)");
assert.strictEqual(webhookFirstRes.status, "VERIFIED", "Status should be VERIFIED by Webhook");
const receipt2 = webhookFirstRes.receiptNumber;

const frontendLaterRes = processPaymentSuccess("order_DON-E2E-2", "pay_WH_222", "Frontend Callback (User Returned)");
assert.strictEqual(frontendLaterRes.receiptNumber, receipt2, "Frontend callback must restore existing verified payment");

console.log("✅ E2E Test 2 Passed: Browser closed recovery (Webhook before Frontend) verified.\n");

console.log("🎉 All End-to-End Payment Lifecycle Tests Passed Successfully!");
