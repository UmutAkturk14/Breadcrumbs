# API Reference

## `createLogger(options?)`

Creates a logger with a default console transport when `options.transports` is not provided.

```ts
import { createLogger } from "@breadcrumbs/logger";

const log = createLogger({
  level: "debug"
});
```

If you provide `transports`, those transports are used instead of the default console transport.

## `createCoreLogger(options?)`

Creates a logger without any default transport.

```ts
import { createCoreLogger } from "@breadcrumbs/logger/core";

const log = createCoreLogger({
  transports: [(entry) => console.log(entry)]
});
```

Use this when building integrations, tests, or platform-specific entry points.

## `LoggerOptions`

```ts
type LoggerOptions = {
  level?: LogLevel;
  transports?: Transport[];
  scope?: string | string[];
  context?: LogContext;
  now?: () => number;
  monotonicNow?: () => number;
};
```

### `level`

Minimum level to emit. Defaults to `debug`.

### `transports`

Functions that receive emitted `LogEntry` objects.

### `scope`

Initial scope or scope segments.

```ts
createLogger({ scope: "api" });
createLogger({ scope: ["api", "users"] });
```

### `context`

Initial persistent context.

### `now`

Clock used for `LogEntry.timestamp`. Defaults to `Date.now`.

This is mostly useful for tests.

### `monotonicNow`

Clock used for timings. Defaults to `globalThis.performance.now()` when available, otherwise `Date.now()`.

This is mostly useful for tests.

## `Logger`

```ts
type Logger = {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  scope: (name: string) => Logger;
  with: (context: LogContext) => Logger;
  time: (label: string, context?: LogContext) => Timer;
  measure: <T>(label: string, fn: () => T | Promise<T>, context?: LogContext) => Promise<T>;
};
```

## Log Methods

```ts
log.info("Application started");
log.warn("Slow request", { duration: 1200 });
```

Every log method accepts a message and optional structured context.

## `scope(name)`

Returns a new logger with an added scope.

```ts
const users = log.scope("api").scope("users");
```

The parent logger is not mutated.

## `with(context)`

Returns a new logger with persistent context.

```ts
const requestLog = log.with({ requestId: "abc123" });
```

The parent logger is not mutated.

## `time(label, context?)`

Creates a timer. Calling `end()` emits a `debug` log:

```ts
const timer = log.time("database-query");

await queryDatabase();

timer.end({ rows: 10 });
```

The emitted context includes `durationMs`.

## `measure(label, fn, context?)`

Measures a synchronous or asynchronous function and emits a `debug` log after it settles:

```ts
const result = await log.measure("fetch-users", async () => {
  return fetchUsers();
});
```

If `fn` throws or rejects, the timing log is still emitted and the original error is rethrown.

## Types

```ts
type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

type LogEntry = {
  timestamp: number;
  level: LogLevel;
  message: string;
  scope?: string;
  context?: LogContext;
};

type Transport = (entry: LogEntry) => void;
```
