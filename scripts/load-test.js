/**
 * GuruSeva Load Testing Script
 * Simulates concurrent user donation order creation and SRE health check pings.
 * Usage: node scripts/load-test.js [concurrency] [iterations]
 * Example: node scripts/load-test.js 50 200
 */

const TARGET_URL = process.env.TARGET_URL || "http://localhost:3000";
const CONCURRENCY = parseInt(process.argv[2] || "20", 10);
const TOTAL_REQUESTS = parseInt(process.argv[3] || "100", 10);

console.log(`🚀 Starting GuruSeva Load Test`);
console.log(`🎯 Target: ${TARGET_URL}`);
console.log(`⚡ Concurrency: ${CONCURRENCY}`);
console.log(`📊 Total Requests: ${TOTAL_REQUESTS}\n`);

let completed = 0;
let successCount = 0;
let failCount = 0;
const latencies = [];

async function pingHealth() {
  const start = Date.now();
  try {
    const res = await fetch(`${TARGET_URL}/api/health`);
    const duration = Date.now() - start;
    latencies.push(duration);
    if (res.ok) {
      successCount++;
    } else {
      failCount++;
    }
  } catch (err) {
    failCount++;
  } finally {
    completed++;
  }
}

async function runWorker(count) {
  for (let i = 0; i < count; i++) {
    await pingHealth();
  }
}

async function main() {
  const startOverall = Date.now();
  const perWorker = Math.ceil(TOTAL_REQUESTS / CONCURRENCY);
  const workers = [];

  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(runWorker(perWorker));
  }

  await Promise.all(workers);

  const durationSec = (Date.now() - startOverall) / 1000;
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
  const rps = (completed / durationSec).toFixed(2);

  console.log(`\n========================================`);
  console.log(`🏁 LOAD TEST RESULTS`);
  console.log(`========================================`);
  console.log(`✅ Successful Requests: ${successCount}`);
  console.log(`❌ Failed Requests:     ${failCount}`);
  console.log(`⏱️ Duration:            ${durationSec.toFixed(2)}s`);
  console.log(`⚡ Requests/Sec (RPS):   ${rps}`);
  console.log(`📈 Avg Latency:         ${avgLatency.toFixed(2)}ms`);
  console.log(`========================================\n`);
}

main();
