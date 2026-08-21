import dotenv from 'dotenv';
dotenv.config();

function checkRequiredEnvVariable(key: string): string {
    const value = process.env[key];

    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const env = {
    port: Number(process.env.PORT) || 8000,
    isProduction: (process.env.NODE_ENV ?? 'development') === 'production',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    logLevel: process.env.LOG_LEVEL ?? 'info',
    databaseUrl: checkRequiredEnvVariable('DATABASE_URL'),
    jwtSecret: checkRequiredEnvVariable('JWT_SECRET'),
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '7d',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '14d',
    accessTokenCookieName: 'scheduledmate-token',
    refreshCookieName: 'scheduledmate_refresh',
    docsAuthToken: process.env.DOCS_AUTH_TOKEN ?? '',
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? '',
    googleConnectRedirectUri: process.env.GOOGLE_CONNECT_REDIRECT_URI ?? '',
    corsOrigins: (process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    frontendUrl:
        process.env.FRONTEND_URL ?? ((process.env.CORS_ORIGINS ?? '').split(',')[0]?.trim() ?? ''),
    smtpHost: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    smtpPort: Number(process.env.SMTP_PORT) || 587,
    smtpUser: process.env.SMTP_USER ?? '',
    smtpPass: process.env.SMTP_PASS ?? '',
    smtpFrom: process.env.SMTP_FROM ?? (process.env.SMTP_USER ?? ''),
    smtpSecure: (process.env.SMTP_SECURE ?? 'false') === 'true',
    otpTtlMinutes: Number(process.env.e) || 10,
    openrouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
    openrouterModel:
        process.env.OPENROUTER_MODEL ?? 'google/gemma-4-26b-a4b-it:free',
    openrouterBaseUrl:
        process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
} as const;
