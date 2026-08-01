/**
 * Payment Fee Calculation Utility
 *
 * Calculates Razorpay payment gateway processing charges to pass through
 * to the devotee, ensuring the temple always receives the full Seva amount.
 *
 * All internal math is performed in INTEGER PAISE to avoid floating-point
 * inaccuracies. Values are converted to rupees only for display.
 *
 * Configuration is via environment variables so fees can be updated without
 * code changes if Razorpay pricing changes.
 */

/** Gateway fee percentage (default 2%) */
const GATEWAY_FEE_PERCENT = parseFloat(
  process.env.RAZORPAY_GATEWAY_FEE_PERCENT || "2"
);

/** GST percentage on gateway fee (default 18%) */
const GST_ON_FEE_PERCENT = parseFloat(
  process.env.RAZORPAY_GST_ON_FEE_PERCENT || "18"
);

export interface PaymentFeeBreakdown {
  /** Original seva amount in paise */
  sevaAmountPaise: number;
  /** Gateway fee in paise */
  gatewayFeePaise: number;
  /** GST on gateway fee in paise */
  gatewayGSTPaise: number;
  /** gatewayFee + gatewayGST in paise */
  processingChargePaise: number;
  /** sevaAmount + processingCharge in paise */
  totalPayablePaise: number;

  // ── Display values (rupees, 2 decimal places) ──

  /** Seva amount in rupees */
  sevaAmount: number;
  /** Gateway fee in rupees */
  gatewayFee: number;
  /** GST on gateway fee in rupees */
  gatewayGST: number;
  /** Combined processing charge in rupees (gatewayFee + gatewayGST) */
  processingCharge: number;
  /** Total payable by devotee in rupees */
  totalPayable: number;
}

/**
 * Calculate the payment fee breakdown for a given seva amount.
 *
 * @param sevaAmountRupees - The seva/donation amount in rupees (e.g. 100)
 * @returns Full fee breakdown with both paise (for Razorpay API) and rupee values (for display)
 *
 * @example
 * ```ts
 * const fees = calculatePaymentFees(100);
 * // fees.sevaAmount      = 100
 * // fees.gatewayFee      = 2
 * // fees.gatewayGST      = 0.36
 * // fees.processingCharge = 2.36
 * // fees.totalPayable    = 102.36
 * // fees.totalPayablePaise = 10236
 * ```
 */
export function calculatePaymentFees(sevaAmountRupees: number): PaymentFeeBreakdown {
  if (sevaAmountRupees <= 0) {
    throw new Error("Seva amount must be greater than zero");
  }

  // Convert to paise for integer arithmetic
  const sevaAmountPaise = Math.round(sevaAmountRupees * 100);

  // Gateway fee in paise (round UP so temple never loses money)
  const gatewayFeePaise = Math.ceil(
    (sevaAmountPaise * GATEWAY_FEE_PERCENT) / 100
  );

  // GST on gateway fee in paise (round UP)
  const gatewayGSTPaise = Math.ceil(
    (gatewayFeePaise * GST_ON_FEE_PERCENT) / 100
  );

  // Combined processing charge
  const processingChargePaise = gatewayFeePaise + gatewayGSTPaise;

  // Total payable by devotee
  const totalPayablePaise = sevaAmountPaise + processingChargePaise;

  return {
    sevaAmountPaise,
    gatewayFeePaise,
    gatewayGSTPaise,
    processingChargePaise,
    totalPayablePaise,

    // Display values in rupees (2 decimal places)
    sevaAmount: paisToRupees(sevaAmountPaise),
    gatewayFee: paisToRupees(gatewayFeePaise),
    gatewayGST: paisToRupees(gatewayGSTPaise),
    processingCharge: paisToRupees(processingChargePaise),
    totalPayable: paisToRupees(totalPayablePaise),
  };
}

/**
 * Convert paise to rupees with exactly 2 decimal places.
 */
function paisToRupees(paise: number): number {
  return Math.round(paise) / 100;
}

/**
 * Format a rupee amount for display (e.g. "102.36").
 */
export function formatRupees(amount: number): string {
  return amount.toFixed(2);
}
