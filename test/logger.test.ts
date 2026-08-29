import { describe, expect, it } from "vitest";
import { createCoreLogger, jsonFormatter, prettyFormatter } from "../src/index.js";
import type { LogEntry } from "../src/index.js";

const createSink = () => {
  const entries: LogEntry[] = [];

  return {
    entries,
    transport: (entry: LogEntry) => entries.push(entry)
  };
};

describe("createCoreLogger", () => {
  it("filters entries below the configured level", () => {
    const sink = createSink();
    const logger = createCoreLogger({ level: "info", transports: [sink.transport], now: () => 1 });

    logger.debug("hidden");
    logger.info("visible");

    expect(sink.entries).toEqual([
      {
        timestamp: 1,
        level: "info",
        message: "visible"
      }
    ]);
  });

  it("creates structured entries with scoped loggers", () => {
    const sink = createSink();
    const logger = createCoreLogger({ transports: [sink.transport], now: () => 123 });

    logger.scope("api").scope("users").warn("Slow request", { duration: 1200 });

    expect(sink.entries[0]).toEqual({
      timestamp: 123,
      level: "warn",
      message: "Slow request",
      scope: "api:users",
      context: {
        duration: 1200
      }
    });
  });

  it("merges persistent and per-message context without mutating parent loggers", () => {
    const sink = createSink();
    const logger = createCoreLogger({ transports: [sink.transport], now: () => 10 });
    const child = logger.with({ requestId: "abc123", userId: 1 });

    child.info("Request received", { userId: 2, route: "/users" });
    logger.info("Parent logger");

    expect(sink.entries).toEqual([
      {
        timestamp: 10,
        level: "info",
        message: "Request received",
        context: {
          requestId: "abc123",
          userId: 2,
          route: "/users"
        }
      },
      {
        timestamp: 10,
        level: "info",
        message: "Parent logger"
      }
    ]);
  });

  it("writes to multiple transports", () => {
    const first = createSink();
    const second = createSink();
    const logger = createCoreLogger({ transports: [first.transport, second.transport], now: () => 2 });

    logger.error("Failed");

    expect(first.entries).toHaveLength(1);
    expect(second.entries).toEqual(first.entries);
  });

  it("emits timing entries with a monotonic clock", () => {
    const sink = createSink();
    const ticks = [100, 137];
    const logger = createCoreLogger({
      transports: [sink.transport],
      now: () => 1,
      monotonicNow: () => ticks.shift() ?? 137
    });

    logger.time("database-query").end({ rows: 2 });

    expect(sink.entries[0]).toEqual({
      timestamp: 1,
      level: "debug",
      message: "database-query",
      context: {
        rows: 2,
        durationMs: 37
      }
    });
  });
});

describe("formatters", () => {
  it("serializes errors for JSON output", () => {
    const error = new Error("Nope");

    expect(
      JSON.parse(
        jsonFormatter({
          timestamp: 1,
          level: "error",
          message: "Failed",
          context: { error }
        })
      )
    ).toMatchObject({
      timestamp: 1,
      level: "error",
      message: "Failed",
      context: {
        error: {
          name: "Error",
          message: "Nope"
        }
      }
    });
  });

  it("formats readable pretty output", () => {
    expect(
      prettyFormatter({
        timestamp: Date.UTC(2026, 0, 1, 12, 48, 31),
        level: "debug",
        scope: "Checkout",
        message: "Checkout opened"
      })
    ).toContain("DEBUG [Checkout] Checkout opened");
  });
});
