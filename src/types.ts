export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

export type LogEntry = {
  timestamp: number;
  level: LogLevel;
  message: string;
  scope?: string;
  context?: LogContext;
};

export type Transport = (entry: LogEntry) => void;

export type Logger = {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  scope: (name: string) => Logger;
  with: (context: LogContext) => Logger;
  time: (label: string, context?: LogContext) => Timer;
  measure: <T>(label: string, fn: () => T | Promise<T>, context?: LogContext) => Promise<T>;
};

export type Timer = {
  end: (context?: LogContext) => void;
};

export type LoggerOptions = {
  level?: LogLevel;
  transports?: Transport[];
  scope?: string | string[];
  context?: LogContext;
  now?: () => number;
  monotonicNow?: () => number;
};
