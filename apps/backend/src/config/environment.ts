import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1).url().refine((value) => value.startsWith('postgres://') || value.startsWith('postgresql://'), 'must be a PostgreSQL URL'),
  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_ACCESS_TTL: z.string().default('10m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  SMS_MODE: z.enum(['test', 'live']).default('test'),
  OTP_TTL_SECONDS: z.coerce.number().int().min(60).max(900).default(300),
  OTP_PEPPER: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
});

export function validateEnvironment(input: Record<string, unknown>) {
  const result = environmentSchema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  if (result.data.NODE_ENV === 'production') {
    if (!result.data.JWT_ACCESS_SECRET) throw new Error('JWT_ACCESS_SECRET is required in production');
    if (result.data.JWT_ACCESS_SECRET.includes('replace_with')) {
      throw new Error('JWT_ACCESS_SECRET must be changed before production');
    }
  }
  return { ...input, ...result.data };
}
