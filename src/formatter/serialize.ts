import type { LogContext } from "../types.js";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (Object.prototype.toString.call(value) !== "[object Object]") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
};

const serializeError = (error: Error): Record<string, unknown> => {
  const serialized: Record<string, unknown> = {
    name: error.name,
    message: error.message
  };

  if (error.stack !== undefined) {
    serialized.stack = error.stack;
  }

  if ("cause" in error) {
    serialized.cause = serializeValue(error.cause);
  }

  return serialized;
};

export const serializeValue = (value: unknown): unknown => {
  if (value instanceof Error) {
    return serializeError(value);
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, serializeValue(entryValue)]));
  }

  return value;
};

export const serializeContext = (context: LogContext): LogContext =>
  Object.fromEntries(Object.entries(context).map(([key, value]) => [key, serializeValue(value)]));
