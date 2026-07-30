import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import { ZodSchema } from "zod";

/**
 * Validates and coerces `body`/`query`/`param` payloads against a Zod
 * schema. Usage: `@Body(new ZodValidationPipe(createTaskSchema)) dto: CreateTaskDto`.
 *
 * All module DTOs are Zod schemas (see each module's `dto/*.schemas.ts`)
 * rather than class-validator decorators, per the AlienOS backend spec.
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      throw new BadRequestException({
        message: "Validation failed",
        issues,
      });
    }
    return result.data;
  }
}
