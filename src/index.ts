import { createCoreLogger } from "./logger.js";
import { consoleTransport } from "./transports/console.js";
import type { Logger, LoggerOptions } from "./types.js";

export const createLogger = (options: LoggerOptions = {}): Logger =>
  createCoreLogger({
    ...options,
    transports: options.transports ?? [consoleTransport()]
  });

export { createCoreLogger } from "./logger.js";
export { jsonFormatter } from "./formatter/json.js";
export { prettyFormatter } from "./formatter/pretty.js";
export { consoleTransport } from "./transports/console.js";
export type { LogContext, LogEntry, Logger, LoggerOptions, LogLevel, Timer, Transport } from "./types.js";
