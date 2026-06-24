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

export async function connectToDatabase() {
  if (cache.conn) {
    return cache.conn;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new AppError("DATABASE_ERROR", "MONGODB_URI is not configured");
  }

  try {
    cache.promise ??= mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000
    });
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (error) {
    cache.promise = null;
    console.error("MongoDB connection failed:", error);
    throw new AppError("DATABASE_ERROR", "Failed to connect to MongoDB");
  }
}
