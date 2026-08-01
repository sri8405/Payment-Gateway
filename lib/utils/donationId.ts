/**
 * Generate a collision-resistant donation ID.
 *
 * Format: DON-<YYYYMMDD>-<timestamp_ms>-<random4>
 *
 * The previous count-based approach (DON-YYYYMMDD-NNNNN) had a race condition:
 * concurrent requests could read the same daily count and produce the same ID.
 * The donationId field has a unique index on MongoDB, so one write would fail
 * with E11000 and the booking would silently error.
 *
 * This version uses millisecond timestamp + 4-digit random suffix, which is
 * collision-resistant without requiring a DB read. The unique index still
 * acts as the final guard.
 */
export function generateDonationId(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const ts = Date.now().toString().slice(-6); // last 6 digits of ms timestamp
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
  return `DON-${year}${month}${day}-${ts}${rand}`;
}
