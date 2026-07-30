export interface AppConfig {
  app: {
    env: string;
    port: number;
    apiPrefix: string;
  };
  cors: {
    origin: string;
  };
  database: {
    url: string;
  };
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
    refreshExpiresInRememberMe: string;
  };
  security: {
    bcryptSaltRounds: number;
    throttleTtl: number;
    throttleLimit: number;
    emailVerificationExpiresIn: string;
    passwordResetExpiresIn: string;
  };
  frontendUrl: string;
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    from: string;
  };
  ai: {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    geminiApiKey?: string;
    ollamaBaseUrl?: string;
  };
  storage: {
    driver: "local" | "s3";
    localRoot: string;
    s3?: {
      bucket?: string;
      region?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
    };
  };
  logging: {
    level: string;
  };
}

/** Single source of truth for env-derived configuration. Registered via @nestjs/config. */
export default (): AppConfig => ({
  app: {
    env: process.env.NODE_ENV ?? "development",
    port: parseInt(process.env.PORT ?? "4000", 10),
    apiPrefix: process.env.API_PREFIX ?? "api",
  },
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  },
  database: {
    url: process.env.DATABASE_URL ?? "",
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
    refreshExpiresInRememberMe: process.env.JWT_REFRESH_EXPIRES_IN_REMEMBER_ME ?? "30d",
  },
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "12", 10),
    throttleTtl: parseInt(process.env.THROTTLE_TTL ?? "60", 10),
    throttleLimit: parseInt(process.env.THROTTLE_LIMIT ?? "100", 10),
    emailVerificationExpiresIn: process.env.EMAIL_VERIFICATION_EXPIRES_IN ?? "24h",
    passwordResetExpiresIn: process.env.PASSWORD_RESET_EXPIRES_IN ?? "1h",
  },
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  email: {
    smtpHost: process.env.SMTP_HOST ?? "",
    smtpPort: parseInt(process.env.SMTP_PORT ?? "587", 10),
    smtpUser: process.env.SMTP_USER ?? "",
    smtpPassword: process.env.SMTP_PASSWORD ?? "",
    from: process.env.SMTP_FROM ?? "AlienOS <no-reply@alienos.dev>",
  },
  ai: {
    openaiApiKey: process.env.AI_OPENAI_API_KEY || undefined,
    anthropicApiKey: process.env.AI_ANTHROPIC_API_KEY || undefined,
    geminiApiKey: process.env.AI_GEMINI_API_KEY || undefined,
    ollamaBaseUrl: process.env.AI_OLLAMA_BASE_URL || undefined,
  },
  storage: {
    driver: (process.env.STORAGE_DRIVER as "local" | "s3") ?? "local",
    localRoot: process.env.STORAGE_LOCAL_ROOT ?? "./storage",
    s3: {
      bucket: process.env.STORAGE_S3_BUCKET,
      region: process.env.STORAGE_S3_REGION,
      accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY,
    },
  },
  logging: {
    level: process.env.LOG_LEVEL ?? "debug",
  },
});
