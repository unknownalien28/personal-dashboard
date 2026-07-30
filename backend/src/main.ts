import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { WinstonModule } from "nest-winston";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { buildLoggerOptions } from "./config/logger.config";
import { setupSwagger } from "./config/swagger.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(buildLoggerOptions()),
  });

  const config = app.get(ConfigService);

  // --- Security -------------------------------------------------------
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.get<string>("cors.origin"),
    credentials: true,
  });

  // --- API contract -----------------------------------------------------
  const apiPrefix = config.get<string>("app.apiPrefix") ?? "api";
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

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
