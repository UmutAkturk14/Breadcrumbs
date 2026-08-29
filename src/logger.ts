import type { LogContext, LogEntry, Logger, LoggerOptions, LogLevel, Transport } from "./types.js";

const levelWeights: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const defaultNow = (): number => Date.now();

const defaultMonotonicNow = (): number => {
  const maybePerformance = globalThis.performance;
  return typeof maybePerformance?.now === "function" ? maybePerformance.now() : Date.now();
};

const normalizeScopes = (scope: string | string[] | undefined): string[] => {
  if (scope === undefined) {
    return [];
  }

  return Array.isArray(scope) ? scope.filter(Boolean) : [scope].filter(Boolean);
};

const mergeContext = (base?: LogContext, next?: LogContext): LogContext | undefined => {
  if (base === undefined && next === undefined) {
    return undefined;
  }

  return {
    ...(base ?? {}),
    ...(next ?? {})
  };
};

type InternalLoggerOptions = Required<Pick<LoggerOptions, "level" | "transports" | "now" | "monotonicNow">> & {
  scopes: string[];
  context?: LogContext;
};

const createLoggerFromState = (state: InternalLoggerOptions): Logger => {
  const shouldWrite = (level: LogLevel): boolean => levelWeights[level] >= levelWeights[state.level];

  const write = (level: LogLevel, message: string, context?: LogContext): void => {
    if (!shouldWrite(level)) {
      return;
    }

    const mergedContext = mergeContext(state.context, context);
    const entry: LogEntry = {
      timestamp: state.now(),
      level,
      message,
      ...(state.scopes.length > 0 ? { scope: state.scopes.join(":") } : {}),
      ...(mergedContext !== undefined ? { context: mergedContext } : {})
    };

    for (const transport of state.transports) {
      transport(entry);
    }
  };

  const logger: Logger = {
    debug: (message, context) => write("debug", message, context),
    info: (message, context) => write("info", message, context),
    warn: (message, context) => write("warn", message, context),
    error: (message, context) => write("error", message, context),
    scope: (name) =>
      createLoggerFromState({
        ...state,
        scopes: [...state.scopes, name].filter(Boolean)
      }),
    with: (context) => {
      const mergedContext = mergeContext(state.context, context);

      return createLoggerFromState({
        ...state,
        ...(mergedContext !== undefined ? { context: mergedContext } : {})
      });
    },
    time: (label, context) => {
      const startedAt = state.monotonicNow();

      return {
        end: (endContext) => {
          write("debug", label, {
            ...mergeContext(context, endContext),
            durationMs: state.monotonicNow() - startedAt
          });
        }
      };
    },
    measure: async (label, fn, context) => {
      const startedAt = state.monotonicNow();

      try {
        return await fn();
      } finally {
        write("debug", label, {
          ...(context ?? {}),
          durationMs: state.monotonicNow() - startedAt
        });
      }
    }
  };

  return logger;
};

export const createCoreLogger = (options: LoggerOptions = {}): Logger => {
  const state: InternalLoggerOptions = {
    level: options.level ?? "debug",
    transports: options.transports ?? [],
    scopes: normalizeScopes(options.scope),
    ...(options.context !== undefined ? { context: options.context } : {}),
    now: options.now ?? defaultNow,
    monotonicNow: options.monotonicNow ?? defaultMonotonicNow
  };

  return createLoggerFromState(state);
};

export type { LogContext, LogEntry, Logger, LoggerOptions, LogLevel, Transport };
