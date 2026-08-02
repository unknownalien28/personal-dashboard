import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { WinstonModule } from "nest-winston";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { Reflector } from "@nestjs/core";
import { buildLoggerOptions } from "./config/logger.config";
import { setupSwagger } from "./config/swagger.config";

const INSECURE_DEFAULT_SECRETS = new Set(["dev-access-secret", "dev-refresh-secret"]);

/**
 * `configuration.ts` falls back to hardcoded `dev-*-secret` values for
 * `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` so the app still boots locally
 * with a bare-minimum `.env`. That fallback must never reach a real
 * deployment — anyone who read this repo's source would know the default
 * secrets and could forge access/refresh tokens for any user. Fail fast
 * instead of silently starting an insecure production server.
 */
function assertProductionSecretsAreConfigured(config: ConfigService): void {
  if (config.get<string>("app.env") !== "production") return;

  const accessSecret = config.get<string>("jwt.accessSecret");
  const refreshSecret = config.get<string>("jwt.refreshSecret");
  const missingOrDefault =
    !accessSecret || !refreshSecret || INSECURE_DEFAULT_SECRETS.has(accessSecret) || INSECURE_DEFAULT_SECRETS.has(refreshSecret);

  if (missingOrDefault) {
    throw new Error(
      "Refusing to start with NODE_ENV=production: JWT_ACCESS_SECRET and/or JWT_REFRESH_SECRET are unset or still using their insecure development defaults. Set both to strong, unique random values before deploying.",
    );
  }
}

/**
 * Every real AI provider (Gemini, OpenAI, Anthropic, Ollama) combines the
 * caller's cancellation signal with a request timeout via `AbortSignal.any()`
 * (added in Node 20.3). `package.json`'s `engines` field documents this, but
 * `engines` alone only produces an installer *warning*, not a hard failure —
 * so without this check, running on an older Node silently works right up
 * until the first streaming AI request, which then throws a cryptic
 * "AbortSignal.any is not a function" deep inside a provider. Fail fast and
 * clearly instead.
 */
function assertNodeVersionSupportsAbortSignalAny(): void {
  if (typeof AbortSignal.any !== "function") {
    throw new Error(
      `AlienOS backend requires Node.js >= 20.3 (AbortSignal.any is required by every AI provider's cancellation/timeout handling). Current version: ${process.version}. Please upgrade Node.`,
    );
  }
}

async function bootstrap() {
  assertNodeVersionSupportsAbortSignalAny();

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(buildLoggerOptions()),
  });

  const config = app.get(ConfigService);

  // --- Security -------------------------------------------------------
  assertProductionSecretsAreConfigured(config);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.get<string>("cors.origin"),
    credentials: true,
  });

  // Express's body-parser defaults to a 100KB JSON body limit if never
  // configured. That's wildly inconsistent with storage.controller.ts's own
  // MAX_UPLOAD_BYTES (15MB) for file uploads sent as base64 JSON - base64
  // encoding inflates a file by ~33%, so ANY attachment over roughly 75KB of
  // original size was being silently rejected by Express itself before our
  // own 15MB check ever ran. Raised to comfortably cover a 15MB file's
  // base64 form plus JSON/field overhead.
  app.use(json({ limit: "21mb" }));
  app.use(urlencoded({ extended: true, limit: "21mb" }));

  // --- API contract -----------------------------------------------------
  const apiPrefix = config.get<string>("app.apiPrefix") ?? "api";
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor(app.get(Reflector)));

  // --- Docs ---------------------------------------------------------------
  setupSwagger(app, apiPrefix);

  const port = config.get<number>("app.port") ?? 4000;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`🛰  AlienOS backend listening on http://localhost:${port}/${apiPrefix}`);
  // eslint-disable-next-line no-console
  console.log(`📚 API docs available at http://localhost:${port}/${apiPrefix}/docs`);
}

bootstrap();
