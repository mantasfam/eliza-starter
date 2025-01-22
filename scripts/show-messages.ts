import Database from "better-sqlite3";
import { join } from "path";
import { existsSync } from "fs";

const dbPath = join(process.cwd(), "data", "db.sqlite");

if (!existsSync(dbPath)) {
  console.log("Database file not found at:", dbPath);
  console.log("Make sure the application has run and stored some messages first.");
  process.exit(1);
}

console.log(`Using database at: ${dbPath}`);
const db = new Database(dbPath);

// Check if the cache table exists
const tableExists = db
  .prepare(
    `
  SELECT name 
  FROM sqlite_master 
  WHERE type='table' AND name='cache'
`
  )
  .get();

if (!tableExists) {
  console.log("No messages found - the database is empty or hasn't been created yet.");
  process.exit(0);
}

// Get all messages from the cache table
const messages = db
  .prepare(
    `
  SELECT key, value, createdAt
  FROM cache 
  WHERE key LIKE 'telegram-%' OR key LIKE 'twitter-%'
  ORDER BY createdAt ASC
`
  )
  .all();

if (messages.length === 0) {
  console.log("No messages found in the database.");
  process.exit(0);
}

console.log(`Found ${messages.length} total messages:\n`);

// Display each message
messages.forEach((row) => {
  try {
    if (row.key === "telegram-last-message-id") {
      const data = JSON.parse(row.value);
      console.log(`Last Message ID: ${data.value}`);
      console.log("-".repeat(50));
      return;
    }

    let message;
    const data = JSON.parse(row.value);

    // Handle both old and new formats
    if (data.value && typeof data.value === "object") {
      // Old format
      message = data.value;
    } else if (data.value && typeof data.value === "string") {
      // New format
      message = JSON.parse(data.value);
    }

    if (!message) {
      console.log(`Skipping invalid message format for ${row.key}`);
      return;
    }

    const type = row.key.startsWith("telegram-") ? "Telegram" : "Twitter";

    console.log(`Type: ${type}`);
    console.log(`Key: ${row.key}`);
    console.log(`Created: ${new Date(row.createdAt).toLocaleString()}`);
    console.log(`From: ${message.metadata?.author || message.metadata?.username || "unknown"}`);
    if (message.metadata?.date) {
      console.log(`Message Date: ${new Date(message.metadata.date).toLocaleString()}`);
    }
    console.log(`Content: ${message.content}`);
    if (message.metadata?.url) {
      console.log(`URL: ${message.metadata.url}`);
    }
    console.log("-".repeat(50));
  } catch (error) {
    console.log(`Error parsing message ${row.key}:`, error);
    console.log("Raw value:", row.value);
    console.log("-".repeat(50));
  }
});
