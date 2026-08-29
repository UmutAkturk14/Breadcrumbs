import type { LogEntry } from "../types.js";
import { serializeContext } from "./serialize.js";

export const jsonFormatter = (entry: LogEntry): string =>
  JSON.stringify({
    ...entry,
    ...(entry.context !== undefined ? { context: serializeContext(entry.context) } : {})
  });
