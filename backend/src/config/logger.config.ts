import { utilities as nestWinstonModuleUtilities } from "nest-winston";
import * as winston from "winston";

/** Builds the Winston options used by nest-winston as AlienOS's global logger. */
export function buildLoggerOptions(): winston.LoggerOptions {
  const level = process.env.LOG_LEVEL ?? "debug";
  const isProduction = process.env.NODE_ENV === "production";

  return {
    level,
    transports: [
      new winston.transports.Console({
        format: isProduction
          ? winston.format.combine(winston.format.timestamp(), winston.format.json())
          : winston.format.combine(
              winston.format.timestamp(),
              winston.format.ms(),
              nestWinstonModuleUtilities.format.nestLike("AlienOS", {
                colors: true,
                prettyPrint: true,
              }),
            ),
      }),
    ],
  };
}
