/**
 * Production-Grade Razorpay SDK Singleton Loader Service
 * Handles script loading, singleton promise caching, DOM cleanup, ad-blocker detection, and retry logic.
 */

export interface RazorpayLoadResult {
  success: boolean;
  code?:
    | "ALREADY_LOADED"
    | "SUCCESS"
    | "BLOCKED_BY_EXTENSION"
    | "NETWORK_TIMEOUT"
    | "SCRIPT_ERROR"
    | "UNDEFINED_WINDOW";
  error?: string;
}

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

let sdkPromise: Promise<RazorpayLoadResult> | null = null;

/**
 * Loads the Razorpay Checkout SDK script dynamically with singleton caching,
 * non-destructive retry logic, browser-event tracking, and polling verification.
 */
export function loadRazorpaySDK(timeoutMs = 10000, maxRetries = 2): Promise<RazorpayLoadResult> {
  const startTimeGlobal = Date.now();

  // 1. Check if window.Razorpay is already available
  if (typeof window !== "undefined" && typeof window.Razorpay === "function") {
    console.log(`[RazorpaySDKLoader] SDK already initialized on window. Elapsed: ${Date.now() - startTimeGlobal}ms`);
    return Promise.resolve({ success: true, code: "ALREADY_LOADED" });
  }

  // 2. Reuse active loading promise
  if (sdkPromise) {
    console.log(`[RazorpaySDKLoader] Reusing active loading singleton Promise. Elapsed: ${Date.now() - startTimeGlobal}ms`);
    return sdkPromise;
  }

  sdkPromise = new Promise<RazorpayLoadResult>((resolve) => {
    let attempt = 0;

    const executeAttempt = () => {
      attempt++;
      const attemptStartTime = Date.now();
      console.log(`[RazorpaySDKLoader] Attempt ${attempt} of ${maxRetries + 1} starting...`);

      if (typeof window !== "undefined" && typeof window.Razorpay === "function") {
        console.log(`[RazorpaySDKLoader] window.Razorpay found on attempt start. Resolve SUCCESS.`);
        resolve({ success: true, code: "SUCCESS" });
        return;
      }

      // Check for existing script tag
      let script = document.querySelector(`script[src="${SCRIPT_URL}"]`) as HTMLScriptElement | null;
      let isNewScript = false;

      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_URL;
        script.async = true;
        isNewScript = true;
        console.log("[RazorpaySDKLoader] Created fresh script element node.");
      } else {
        console.log("[RazorpaySDKLoader] Found existing script element in DOM. Checking status...");
      }

      let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
      let pollTimer: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
          timeoutTimer = null;
        }
        if (pollTimer) {
          clearTimeout(pollTimer);
          pollTimer = null;
        }
        if (script) {
          script.onload = null;
          script.onerror = null;
        }
      };

      const startPolling = (onVerified: () => void, onFailure: () => void) => {
        const pollStart = Date.now();
        const pollInterval = 50;
        const maxPollDuration = 3000;

        const check = () => {
          if (typeof window !== "undefined" && typeof window.Razorpay === "function") {
            console.log(`[RazorpaySDKLoader] window.Razorpay successfully initialized after ${Date.now() - pollStart}ms polling.`);
            onVerified();
          } else if (Date.now() - pollStart < maxPollDuration) {
            pollTimer = setTimeout(check, pollInterval);
          } else {
            console.warn(`[RazorpaySDKLoader] Polling timed out. window.Razorpay is still undefined after ${maxPollDuration}ms.`);
            onFailure();
          }
        };

        check();
      };

      const handleSuccess = () => {
        // Cancel the load timeout timer immediately
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
          timeoutTimer = null;
        }
        console.log(`[RazorpaySDKLoader] Script load event fired. Beginning polling verification...`);

        startPolling(
          () => {
            cleanup();
            console.log(`[RazorpaySDKLoader] SDK successfully ready. Attempt ${attempt} finished. Total elapsed: ${Date.now() - startTimeGlobal}ms`);
            resolve({ success: true, code: "SUCCESS" });
          },
          () => {
            cleanup();
            if (script && isNewScript) {
              script.remove();
            }

            if (attempt <= maxRetries) {
              console.log(`[RazorpaySDKLoader] Polling failure. Triggering retry attempt...`);
              setTimeout(executeAttempt, 1000);
            } else {
              resolve({
                success: false,
                code: "UNDEFINED_WINDOW",
                error:
                  "Razorpay script loaded but window.Razorpay was not initialized. A browser extension or privacy setting may have blocked script execution.",
              });
            }
          }
        );
      };

      const handleFailure = (reason: string, isBlockedEvent: boolean) => {
        cleanup();
        if (script && isNewScript) {
          script.remove();
        }

        const attemptDuration = Date.now() - attemptStartTime;
        console.error(`[RazorpaySDKLoader] Attempt ${attempt} failed after ${attemptDuration}ms. Reason: ${reason}`);

        // Only classify as ad blocker if it failed with a connection error event rapidly (<800ms)
        const isAdBlocked = isBlockedEvent && (attemptDuration < 800);

        if (isAdBlocked || attempt > maxRetries) {
          resolve({
            success: false,
            code: isAdBlocked ? "BLOCKED_BY_EXTENSION" : "NETWORK_TIMEOUT",
            error: isAdBlocked
              ? "Payment gateway blocked by browser extension or ad blocker (uBlock, Brave Shields, etc.). Please pause ad blocking for this site to complete your donation."
              : reason,
          });
        } else {
          console.log(`[RazorpaySDKLoader] Stalled/Failed connection. Retrying load in 1000ms...`);
          setTimeout(executeAttempt, 1000);
        }
      };

      script.onload = handleSuccess;
      script.onerror = () => handleFailure("Failed to download Razorpay SDK script.", true);

      timeoutTimer = setTimeout(() => {
        handleFailure("Razorpay SDK request timed out.", false);
      }, timeoutMs);

      if (isNewScript) {
        document.head.appendChild(script);
        console.log("[RazorpaySDKLoader] Appended script tag to document head.");
      } else {
        // If script was already in the DOM, check if window.Razorpay is already here or if it is currently loading
        if (typeof window !== "undefined" && typeof window.Razorpay === "function") {
          cleanup();
          resolve({ success: true, code: "SUCCESS" });
        } else {
          // If script element exists but window.Razorpay is not populated yet, wait for its load or poll
          console.log("[RazorpaySDKLoader] Script tag exists. Initiating check/polling...");
          startPolling(
            () => {
              cleanup();
              resolve({ success: true, code: "SUCCESS" });
            },
            () => {
              // Existing script did not load window.Razorpay, remove it to try a fresh one
              cleanup();
              script.remove();
              if (attempt <= maxRetries) {
                setTimeout(executeAttempt, 1000);
              } else {
                resolve({
                  success: false,
                  code: "UNDEFINED_WINDOW",
                  error: "Razorpay script was present but window.Razorpay was not initialized.",
                });
              }
            }
          );
        }
      }
    };

    executeAttempt();
  }).catch((err) => {
    sdkPromise = null;
    return {
      success: false,
      code: "SCRIPT_ERROR",
      error: err?.message || "Failed to load Razorpay SDK",
    };
  });

  sdkPromise.then((res) => {
    if (!res.success) {
      sdkPromise = null;
    }
  });

  return sdkPromise;
}
