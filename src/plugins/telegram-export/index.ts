import { Client, elizaLogger, IAgentRuntime, Plugin, settings } from "@elizaos/core";
import { TelegramExportParser } from "./parser.js";

interface TelegramExportConfig {
  TELEGRAM_EXPORT_PATH: string;
}

async function validateTelegramConfig(runtime: IAgentRuntime): Promise<TelegramExportConfig> {
  if (!settings.TELEGRAM_EXPORT_PATH) {
    elizaLogger.error("TELEGRAM_EXPORT_PATH is required");
    throw new Error("TELEGRAM_EXPORT_PATH is required");
  }

  return {
    TELEGRAM_EXPORT_PATH: settings.TELEGRAM_EXPORT_PATH,
  };
}

const TelegramExportClientInterface: Client = {
  async start(runtime: IAgentRuntime) {
    const config = await validateTelegramConfig(runtime);
    elizaLogger.info(`Starting Telegram export parser with path: ${config.TELEGRAM_EXPORT_PATH}`);
    const parser = new TelegramExportParser(runtime, config.TELEGRAM_EXPORT_PATH);
    await parser.parseAndStore();
    return parser;
  },

  async stop(_runtime: IAgentRuntime) {
    elizaLogger.info("Telegram export parser stopped");
  },
};

export const telegramExportPlugin: Plugin = {
  name: "telegram-export",
  description: "Plugin for parsing Telegram export files",
  clients: [TelegramExportClientInterface],
};
