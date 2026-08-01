import mongoose from "mongoose";
import { AppError } from "@/lib/utils/errors";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null
};

globalForMongoose.mongooseCache = cache;

// Register graceful shutdown handlers
if (typeof process !== "undefined" && !globalThis.__mongoShutdownRegistered) {
  globalThis.__mongoShutdownRegistered = true;
  const gracefulShutdown = async (signal: string) => {
    if (cache.conn) {
      console.log(`[MongoDB] Received ${signal}. Closing database connection pool...`);
      try {
        await mongoose.connection.close();
        cache.conn = null;
        cache.promise = null;
        console.log("[MongoDB] Connection pool closed cleanly.");
      } catch (err) {
        console.error("[MongoDB] Error closing connection pool:", err);
      }
    }
  };

  process.once("SIGINT", () => gracefulShutdown("SIGINT"));
  process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
}

declare global {
  var __mongoShutdownRegistered: boolean | undefined;
}

export async function connectToDatabase() {
  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new AppError("DATABASE_ERROR", "MONGODB_URI is not configured");
  }

  try {
    cache.promise ??= mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (error) {
    cache.promise = null;
    cache.conn = null;
    console.error("MongoDB connection failed:", error);
    throw new AppError("DATABASE_ERROR", "Failed to connect to MongoDB");
  }
}
