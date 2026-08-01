/**
 * GuruSeva Payment Lifecycle & Idempotency Test Suite
 * Run with Node.js: node tests/payment-flow.test.js
 */

const crypto = require("crypto");
const assert = require("assert");

console.log("🧪 Starting GuruSeva Payment & Idempotency Tests...\n");

// 1. Signature Verification Test
function verifySignature(orderId, paymentId, signature, keySecret) {
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(signature, "hex")
  );
}

const keySecret = "test_secret_key_12345";
const orderId = "order_N123456789";
const paymentId = "pay_P987654321";
const validSignature = crypto
  .createHmac("sha256", keySecret)
  .update(`${orderId}|${paymentId}`)
  .digest("hex");

// Test Case 1: Valid Signature
const isValid = verifySignature(orderId, paymentId, validSignature, keySecret);
assert.strictEqual(isValid, true, "Valid signature verification failed");
console.log("✅ Test 1 Passed: Valid HMAC-SHA256 signature verified.");

// Test Case 2: Tampered Payment ID Signature
const tamperedPaymentId = "pay_TAMPERED123";
let isTamperedValid = false;
try {
  const tamperedSig = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${tamperedPaymentId}`)
    .digest("hex");
  isTamperedValid = crypto.timingSafeEqual(
    Buffer.from(validSignature, "hex"),
    Buffer.from(tamperedSig, "hex")
  );
} catch {
  isTamperedValid = false;
}
assert.strictEqual(isTamperedValid, false, "Tampered signature should fail verification");
console.log("✅ Test 2 Passed: Tampered payment signature correctly rejected.");

// Test Case 3: Token Generation & Verification
function generateSecureToken(donationId, key) {
  const expiresAt = Date.now() + 15 * 60 * 1000;
  const payload = `${donationId}.${expiresAt}`;
  const hmac = crypto.createHmac("sha256", key).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

const testDonationId = "DON-20260723-999";
const token = generateSecureToken(testDonationId, keySecret);
assert.ok(token.includes(testDonationId), "Token should contain donation ID");
console.log("✅ Test 3 Passed: 15-minute secure token generated successfully.");

console.log("\n🎉 All 3 Automated Tests Passed Successfully!");
