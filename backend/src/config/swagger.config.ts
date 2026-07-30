import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication, apiPrefix: string): void {
  const config = new DocumentBuilder()
    .setTitle("AlienOS API")
    .setDescription(
      "The central backend service powering AlienOS — tasks, notes, calendar, goals, finance, content, workspace, conversations and more.",
    )
    .setVersion("0.1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      "access-token",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
