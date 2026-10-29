type LogMeta = Record<string, unknown>;

const format = (level: string, message: string, meta?: LogMeta) => {
  const payload = {
    level,
    message,
    time: new Date().toISOString(),
    ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
  };
  return JSON.stringify(payload);
};

export const logger = {
  info: (message: string, meta?: LogMeta) => console.info(format("info", message, meta)),
  warn: (message: string, meta?: LogMeta) => console.warn(format("warn", message, meta)),
  error: (message: string, meta?: LogMeta) => console.error(format("error", message, meta)),
};
