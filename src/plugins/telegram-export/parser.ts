import { IAgentRuntime } from "@elizaos/core";
import fs from "fs/promises";
import path from "path";

interface TelegramMessage {
  id: number;
  type: string;
  date: string;
  from: string;
  text: string;
}

export class TelegramExportParser {
  private runtime: IAgentRuntime;
  private exportPath: string;

  constructor(runtime: IAgentRuntime, exportPath: string) {
    this.runtime = runtime;
    this.exportPath = exportPath;
  }

  async parseAndStore() {
    try {
      const content = await fs.readFile(this.exportPath, "utf-8");
      const data = JSON.parse(content);

      // Process messages
      const messages = data.messages || [];
      console.log(`Found ${messages.length} messages in Telegram export`);

      let newMessages = 0;
      let skippedMessages = 0;

      for (const msg of messages) {
        if (msg.type !== "message" || !msg.text) continue;

        const message: TelegramMessage = {
          id: msg.id,
          type: msg.type,
          date: msg.date,
          from: msg.from || "Unknown",
          text: typeof msg.text === "string" ? msg.text : msg.text.toString(),
        };

        // Check if message already exists
        const key = `telegram-${message.id}`;
        const existingMessage = await this.runtime.cacheManager.get(key);

        if (existingMessage) {
          skippedMessages++;
          continue;
        }

        // Store new message in cache
        await this.runtime.cacheManager.set(key, {
          type: "Telegram",
          content: message.text,
          author: message.from,
          createdAt: new Date(message.date),
        });
        newMessages++;
      }

      console.log(
        `Telegram export parsing completed: ${newMessages} new messages imported, ${skippedMessages} duplicates skipped`
      );
    } catch (error) {
      console.error("Error parsing Telegram export:", error);
      throw error;
    }
  }
}
