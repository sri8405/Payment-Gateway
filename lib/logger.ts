export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogContext {
  correlationId?: string;
  donationId?: string;
  orderId?: string;
  paymentId?: string;
  userId?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

class StructuredLogger {
  private format(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level,
      message,
      ...(context || {}),
      env: process.env.NODE_ENV || "development",
    };

    return JSON.stringify(payload);
  }

  info(message: string, context?: LogContext) {
    console.log(this.format("info", message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.format("warn", message, context));
  }

  error(message: string, context?: LogContext) {
    console.error(this.format("error", message, context));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.format("debug", message, context));
    }
  }
}

export const logger = new StructuredLogger();
