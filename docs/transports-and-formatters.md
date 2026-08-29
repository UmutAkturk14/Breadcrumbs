# Transports And Formatters

Breadcrumbs separates log creation from log output.

- The logger creates structured `LogEntry` objects.
- Transports decide where entries go.
- Formatters decide how entries become strings.

## Transport Type

```ts
import type { Transport } from "@breadcrumbs/logger";

const transport: Transport = (entry) => {
  // Send, store, print, or inspect the entry.
};
```

Transports are synchronous in the current version. If a transport sends logs over the network, it should manage its own queueing, batching, and failures.

## Multiple Transports

```ts
const entries = [];

const log = createLogger({
  transports: [
    consoleTransport(),
    (entry) => entries.push(entry)
  ]
});
```

Each emitted entry is passed to every configured transport.

## Console Transport

```ts
import { consoleTransport } from "@breadcrumbs/logger";

const transport = consoleTransport();
```

The console transport writes:

- `debug` entries to `console.debug`
- `info` entries to `console.info`
- `warn` entries to `console.warn`
- `error` entries to `console.error`

If a method is missing, it falls back to `console.log`.

## Custom Console Target

Useful for tests:

```ts
const messages: string[] = [];

const log = createLogger({
  transports: [
    consoleTransport({
      console: {
        debug: (message) => messages.push(message),
        info: (message) => messages.push(message),
        warn: (message) => messages.push(message),
        error: (message) => messages.push(message),
        log: (message) => messages.push(message)
      }
    })
  ]
});
```

## Pretty Formatter

```ts
import { prettyFormatter } from "@breadcrumbs/logger";
```

Pretty output is intended for local development:

```txt
12:48:31 DEBUG [api:users] Loading profile
{
  "userId": 42
}
```

## JSON Formatter

```ts
import { jsonFormatter } from "@breadcrumbs/logger";
```

JSON output is useful for log collectors and server environments:

```json
{"timestamp":1788000511000,"level":"info","message":"Application started","context":{"service":"api"}}
```

Use it with the console transport:

```ts
const log = createLogger({
  transports: [
    consoleTransport({ formatter: jsonFormatter })
  ]
});
```

## Error Serialization

When formatter output includes an `Error`, the formatter serializes it:

```ts
log.error("Request failed", {
  error: new Error("Database unavailable")
});
```

The serialized error includes:

- `name`
- `message`
- `stack`, when present
- `cause`, when present

The original `LogEntry` is not modified before it reaches the transport. Serialization happens in the formatter.

## Custom Formatter

```ts
import type { LogEntry } from "@breadcrumbs/logger";

const oneLineFormatter = (entry: LogEntry): string => {
  return `${entry.level}: ${entry.message}`;
};

const log = createLogger({
  transports: [
    consoleTransport({ formatter: oneLineFormatter })
  ]
});
```

## Custom Transport

```ts
import { createCoreLogger } from "@breadcrumbs/logger/core";
import type { LogEntry, Transport } from "@breadcrumbs/logger";

const entries: LogEntry[] = [];

const memoryTransport: Transport = (entry) => {
  entries.push(entry);
};

const log = createCoreLogger({
  transports: [memoryTransport]
});
```
