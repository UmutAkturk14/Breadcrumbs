import type { LogEntry, LogLevel, Transport } from "../types.js";
import { prettyFormatter } from "../formatter/pretty.js";

export type ConsoleLike = Pick<Console, "debug" | "info" | "warn" | "error" | "log">;

export type ConsoleTransportOptions = {
  console?: ConsoleLike;
  formatter?: (entry: LogEntry) => string;
};

const methodByLevel: Record<LogLevel, keyof ConsoleLike> = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error"
};

export const consoleTransport = (options: ConsoleTransportOptions = {}): Transport => {
  const target = options.console ?? console;
  const formatter = options.formatter ?? prettyFormatter;

  return (entry) => {
    const method = target[methodByLevel[entry.level]] ?? target.log;
    method.call(target, formatter(entry));
  };
};
