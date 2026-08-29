# Architecture Notes

Breadcrumbs is designed around a small platform-agnostic core.

## Design Goals

- Keep the logger core independent of Node-only APIs.
- Keep log data structured until the transport or formatter layer.
- Make child loggers immutable.
- Allow browser and server entry points to evolve independently.
- Avoid global mutable logger state.
- Avoid large runtime dependencies.

## Source Layout

```txt
src/
  index.ts
  logger.ts
  types.ts
  formatter/
    json.ts
    pretty.ts
    serialize.ts
  transports/
    console.ts
  browser/
    index.ts
  node/
    index.ts
```

## Core

`src/logger.ts` exports `createCoreLogger()`.

The core is responsible for:

- log level filtering
- creating `LogEntry` objects
- composing scopes
- merging context
- invoking transports
- timing helpers

The core does not import `fs`, `path`, `process`, or other Node-specific modules.

## Root Entry

`src/index.ts` exports the ergonomic public API:

```ts
import { createLogger } from "@breadcrumbs/logger";
```

`createLogger()` wraps `createCoreLogger()` and adds `consoleTransport()` by default.

This default is still portable because `console` exists across modern browsers, Node.js, Bun, Deno, Electron, browser extensions, and test environments.

## Transports

Transports are plain functions:

```ts
type Transport = (entry: LogEntry) => void;
```

This keeps the core small and makes transports easy to test. A future Node file transport can live under `src/node/` without being imported by the browser or core entry points.

## Formatters

Formatters convert entries into strings:

```ts
type Formatter = (entry: LogEntry) => string;
```

The type is intentionally not exported yet because the current public API only requires passing formatter-compatible functions to `consoleTransport()`.

## Context Merging

Context merging is shallow and predictable:

```ts
{
  ...persistentContext,
  ...messageContext
}
```

Per-message context wins when keys overlap.

## Scope Composition

Scopes are stored internally as segments and joined with `:` when a log entry is emitted.

```ts
log.scope("api").scope("users");
```

Emits:

```txt
api:users
```

## Package Exports

The package exposes separate entry points:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./core": {
      "types": "./dist/logger.d.ts",
      "import": "./dist/logger.js"
    },
    "./browser": {
      "types": "./dist/browser/index.d.ts",
      "import": "./dist/browser/index.js"
    },
    "./node": {
      "types": "./dist/node/index.d.ts",
      "import": "./dist/node/index.js"
    }
  }
}
```

The current `./browser` and `./node` entries re-export portable pieces. They reserve stable import paths for future platform-specific transports.

## Build

The package uses TypeScript directly:

```bash
npm run build
```

Build output goes to `dist/` with JavaScript, declarations, declaration maps, and source maps.

## Tests

Tests cover:

- level filtering
- structured entries
- nested scopes
- persistent context
- context merge precedence
- parent logger immutability
- multiple transports
- error serialization
- pretty formatting
- timing helpers

Run:

```bash
npm test
```
