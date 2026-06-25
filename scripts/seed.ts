import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Admin } from "../lib/db/models/Admin";
import { Seva } from "../lib/db/models/Seva";
import { TempleSettings } from "../lib/db/models/TempleSettings";

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) {
    return;
  }

  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator);
    const value = trimmed.slice(separator + 1).replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}

async function main() {
  loadEnvLocal();

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  });

  const passwordHash = await bcrypt.hash("admin123", 12);
  await Admin.findOneAndUpdate(
    { username: "admin" },
    { username: "admin", passwordHash, role: "ADMIN" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Promise.all([
    TempleSettings.findOneAndUpdate(
      {},
      {
        templeName: "Sri Padmananda Guruji Ashrama",
        templeDescription: "Seva Booking & Management",
        upiId: "9880742348@ybl",
        upiDisplayName: "Sri Padmananda Guruji Ashrama",
        receiverName: "Sri Padmananda Guruji Ashrama",
        defaultPaymentApp: "generic",
        contactNumber: "9880742348",
        email: "padmanandaguruji@gmail.com",
        address: "Malleshwaram West, Bangalore, Karnataka, India",
        logoUrl: "",
        receiptFooter: "This is an acknowledgement, not a payment confirmation"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
    Seva.findOneAndUpdate(
      { name: "Annadana" },
      {
        name: "Annadana",
        description: "Daily meal offering for devotees and guests",
        suggestedAmount: 500,
        active: true,
        isSystem: false
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
    Seva.findOneAndUpdate(
      { name: "Gau Seva" },
      {
        name: "Gau Seva",
        description: "Support care and feeding for temple cows",
        suggestedAmount: 250,
        active: true,
        isSystem: false
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
    Seva.findOneAndUpdate(
      { name: "Temple Maintenance" },
      {
        name: "Temple Maintenance",
        description: "Help maintain the temple premises and facilities",
        suggestedAmount: 1000,
        active: true,
        isSystem: false
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  ]);

  await mongoose.disconnect();
  console.log("Seed completed: admin user and sample sevas are ready.");
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
