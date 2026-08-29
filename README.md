# Breadcrumbs Logger

A small structured TypeScript logger for browser and server runtimes.

Breadcrumbs is intentionally lightweight. The core logger creates structured `LogEntry` objects, applies level filtering, composes scopes and context, then passes entries to transports. Formatting and output are separate from the core so browser builds do not need Node-specific code.

## Install

This package is currently developed locally.

```bash
npm install
npm run build
```

When published, it can be installed like a normal npm package:

```bash
npm install @breadcrumbs/logger
```

## Quick Start

```ts
import { createLogger } from "@breadcrumbs/logger";

const log = createLogger({ level: "debug" });

log.debug("Loading user", { userId: 42 });
log.info("Application started");
log.warn("Slow request", { duration: 1200 });
log.error("Request failed", { error: new Error("Database unavailable") });
```

By default, `createLogger()` writes to `console` using the pretty formatter.

## Local Try-Out

After building, create a small file such as `try.mjs`:

```js
import { createLogger } from "./dist/index.js";

const log = createLogger({ level: "debug" });

log.info("Application started");

const requestLog = log.scope("api").scope("users").with({
  requestId: "abc123",
  userId: 42
});

requestLog.debug("Loading profile");
requestLog.warn("Slow request", { duration: 1200 });
```

Run it:

```bash
node try.mjs
```

## Log Levels

Supported levels are:

```ts
type LogLevel = "debug" | "info" | "warn" | "error";
```

The configured level is the minimum emitted level:

```ts
const log = createLogger({ level: "info" });

log.debug("Ignored");
log.info("Written");
```

Level order is:

```txt
debug < info < warn < error
```

## Structured Entries

Transports receive structured objects:

```ts
type LogEntry = {
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  scope?: string;
  context?: Record<string, unknown>;
};
```

This keeps logging data useful for custom transports, JSON output, tests, and future integrations.

## Scopes

Use `scope()` to create child loggers:

```ts
const api = log.scope("api");
const users = api.scope("users");

users.info("User loaded");
```

Nested scopes are joined with `:`, so the entry scope becomes:

```txt
api:users
```

Child loggers are immutable. Creating a scoped logger does not change its parent.

## Persistent Context

Use `with()` to attach metadata to every log from a child logger:

```ts
const requestLog = log.with({
  requestId: "abc123",
  userId: 42
});

requestLog.info("Request received");
requestLog.info("Request completed", { statusCode: 200 });
```

Persistent context and per-message context are shallow-merged. Per-message values win when keys overlap:

```ts
const requestLog = log.with({ userId: 1 });

requestLog.info("User updated", { userId: 2 });
```

The emitted context contains `userId: 2`.

## Transports

A transport is a function that receives a `LogEntry`:

```ts
import type { Transport } from "@breadcrumbs/logger";

const memoryTransport: Transport = (entry) => {
  entries.push(entry);
};
```

Use one or more transports:

```ts
import { createLogger, consoleTransport } from "@breadcrumbs/logger";

const log = createLogger({
  transports: [
    consoleTransport(),
    memoryTransport
  ]
});
```

If you pass `transports`, they replace the default console transport.

## Formatters

Breadcrumbs includes two formatters:

- `prettyFormatter(entry)` for readable development output
- `jsonFormatter(entry)` for line-oriented structured output

```ts
import { createLogger, consoleTransport, jsonFormatter } from "@breadcrumbs/logger";

const log = createLogger({
  transports: [
    consoleTransport({ formatter: jsonFormatter })
  ]
});
```

Errors in context are serialized with useful fields such as `name`, `message`, `stack`, and `cause`.

## Timing

Timing helpers emit `debug` entries with `durationMs`.

```ts
const timer = log.time("database-query");

await fetchUsers();

timer.end({ rows: 10 });
```

Or measure a function:

```ts
await log.measure("fetch-users", async () => {
  return fetchUsers();
});
```

Timing uses `globalThis.performance.now()` when available and falls back to `Date.now()`.

## Core Logger

Use `createCoreLogger()` when you want no default transport:

```ts
import { createCoreLogger } from "@breadcrumbs/logger/core";

const entries = [];

const log = createCoreLogger({
  transports: [(entry) => entries.push(entry)]
});
```

The core logger does not import Node-only APIs such as `fs`, `path`, or `process`.

## Package Scripts

```bash
npm run typecheck
npm test
npm run build
```

## More Documentation

- [Usage Guide](docs/usage.md)
- [API Reference](docs/api.md)
- [Transports And Formatters](docs/transports-and-formatters.md)
- [Architecture Notes](docs/architecture.md)
