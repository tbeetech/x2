import pino from "pino";

const level = process.env.LOG_LEVEL ?? "info";
const transportTargets = [];

if (process.env.NODE_ENV !== "production") {
  transportTargets.push({
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      levelFirst: true,
    },
  });
}

const logger = pino({
  level,
  base: undefined,
}, transportTargets.length ? pino.transport({ targets: transportTargets }) : undefined);

export default logger;
