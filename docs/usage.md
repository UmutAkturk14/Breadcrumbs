# Usage Guide

This guide shows the common ways to use Breadcrumbs Logger.

## Create A Logger

```ts
import { createLogger } from "@breadcrumbs/logger";

const log = createLogger();

log.info("Application started");
```

`createLogger()` uses the console transport by default.

## Set The Minimum Level

```ts
const log = createLogger({
  level: "info"
});

log.debug("Ignored");
log.info("Written");
log.warn("Written");
log.error("Written");
```

The level order is:

```txt
debug < info < warn < error
```

## Add Context

Pass structured data as the second argument:

```ts
log.info("User loaded", {
  userId: 42,
  cacheHit: true
});
```

Context stays structured until a transport or formatter decides how to output it.

## Use Scopes

Scopes identify the subsystem that emitted a log:

```ts
const authLog = log.scope("auth");

authLog.info("Login attempt");
authLog.warn("Invalid password");
```

Scopes compose:

```ts
const apiLog = log.scope("api");
const userLog = apiLog.scope("users");

userLog.info("Profile updated");
```

The resulting scope is `api:users`.

## Use Persistent Context

Use `with()` when several logs share the same metadata:

```ts
const requestLog = log.with({
  requestId: "abc123",
  userId: 42
});

requestLog.info("Request received");
requestLog.debug("Loading profile");
requestLog.info("Request completed", { statusCode: 200 });
```

Per-message context is shallow-merged over persistent context:

```ts
const userLog = log.with({ userId: 1 });

userLog.info("User changed", { userId: 2 });
```

The emitted entry contains `userId: 2`.

## Combine Scopes And Context

```ts
const requestLog = log
  .scope("api")
  .scope("users")
  .with({ requestId: "abc123" });

requestLog.info("User loaded", { userId: 42 });
```

This emits an entry with scope `api:users` and context `{ requestId: "abc123", userId: 42 }`.

## Log Errors

```ts
try {
  await saveUser();
} catch (error) {
  log.error("Failed to save user", { error });
}
```

Formatters serialize `Error` instances into useful fields:

```ts
{
  name: "Error",
  message: "Failed",
  stack: "..."
}
```

If the error has a `cause`, that value is serialized too.

## Time Work

Use `time()` when the start and end happen in different places:

```ts
const timer = log.time("database-query");

await queryDatabase();

timer.end({ table: "users" });
```

Use `measure()` when the work can be wrapped:

```ts
const users = await log.measure("fetch-users", async () => {
  return fetchUsers();
});
```

Both helpers emit `debug` entries containing `durationMs`.

## Use JSON Output

```ts
import { createLogger, consoleTransport, jsonFormatter } from "@breadcrumbs/logger";

const log = createLogger({
  transports: [
    consoleTransport({ formatter: jsonFormatter })
  ]
});

log.info("Application started", { service: "api" });
```

## Test With A Memory Transport

```ts
import { createCoreLogger } from "@breadcrumbs/logger/core";
import type { LogEntry } from "@breadcrumbs/logger";

const entries: LogEntry[] = [];

const log = createCoreLogger({
  transports: [(entry) => entries.push(entry)],
  now: () => 123
});

log.info("Test log");
```

`entries` now contains the structured log entry.
