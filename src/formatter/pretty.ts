import type { LogEntry, LogLevel } from "../types.js";
import { serializeContext } from "./serialize.js";

const levelLabels: Record<LogLevel, string> = {
  debug: "DEBUG",
  info: "INFO ",
  warn: "WARN ",
  error: "ERROR"
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

export const prettyFormatter = (entry: LogEntry): string => {
  const scope = entry.scope !== undefined ? ` [${entry.scope}]` : "";
  const firstLine = `${formatTime(entry.timestamp)} ${levelLabels[entry.level]}${scope} ${entry.message}`;

  if (entry.context === undefined || Object.keys(entry.context).length === 0) {
    return firstLine;
  }

  return `${firstLine}\n${JSON.stringify(serializeContext(entry.context), null, 2)}`;
};
