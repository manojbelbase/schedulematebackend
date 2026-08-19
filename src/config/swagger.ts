import type { JsonObject } from "swagger-ui-express";

/**
 * OpenAPI 3.0 document served at GET /docs-json.
 *
 * This spec is the single source of truth for the `scheduledmatefrontend`
 * monorepo: `pnpm generate-types` runs `@openapi-codegen/typescript` against
 * `${API_BASE_URL}/docs-json` and produces the typed React Query clients in
 * `packages/services/src/{web,backoffice,website}`.
 *
 * RULES:
 * - Every route you add MUST be reflected here (path + responses + schemas).
 * - `components/schemas` becomes the frontend TypeScript types.
 * - `paths` become the frontend React Query hooks.
 * - Keep it valid OpenAPI 3.0.
 * - Paths must match the mounted backend routes (`/api/*`) since the frontend
 *   fetcher calls `baseUrl + path`.
 */

export const swaggerConfig: JsonObject = {
    openapi: "3.0.0",
    info: {
        title: "ScheduledMate API",
        version: "1.0.0",
        description:
            "Express + TypeORM API for ScheduledMate. This OpenAPI spec is consumed by `scheduledmatefrontend` openapi-codegen to auto-generate typed clients for the web, backoffice and website apps.",
    },
    servers: [
        {
            url: "http://localhost:8000",
            description: "Development server",
        },
    ],
    tags: [
        { name: "Health", description: "Server health endpoints" },
        { name: "Auth", description: "Authentication endpoints" },
        { name: "Google", description: "Google Calendar connection endpoints" },
    ],
    paths: {
        "/api/health": {
            get: {
                operationId: "HealthControllerCheckHealth",
                tags: ["Health"],
                summary: "Check server health",
                responses: {
                    "200": {
                        description: "Server is healthy",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/HealthResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/auth/register": {
            post: {
                operationId: "AuthControllerRegister",
                tags: ["Auth"],
                summary: "Register a new user with email and password",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RegisterUserDto" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "User registered successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/AuthResponse" },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid request body",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                    "409": {
                        description: "Email already exists",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/auth/login": {
            post: {
                operationId: "AuthControllerLogin",
                tags: ["Auth"],
                summary: "Sign in with email and password",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginUserDto" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Login successful",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/AuthResponse" },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid request body",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                    "401": {
                        description: "Invalid email or password",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/auth/google": {
            get: {
                operationId: "AuthControllerGoogle",
                tags: ["Auth"],
                summary: "Start Google OAuth flow, redirecting to Google's consent screen",
                parameters: [
                    {
                        name: "redirect",
                        in: "query",
                        required: false,
                        schema: { type: "string", default: "/" },
                        description: "Path to return to after successful login",
                    },
                ],
                responses: {
                    "302": { description: "Redirect to Google's consent screen" },
                },
            },
        },
        "/api/auth/google/callback": {
            get: {
                operationId: "AuthControllerGoogleCallback",
                tags: ["Auth"],
                summary: "Google OAuth callback; sets auth cookies and redirects to the frontend",
                parameters: [
                    { name: "code", in: "query", required: true, schema: { type: "string" } },
                    { name: "state", in: "query", required: true, schema: { type: "string" } },
                ],
                responses: {
                    "302": { description: "Redirects to the frontend after login" },
                },
            },
        },
        "/api/auth/me": {
            get: {
                operationId: "AuthControllerMe",
                tags: ["Auth"],
                summary: "Get the currently authenticated user",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Current user",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UserResponse" },
                            },
                        },
                    },
                    "401": {
                        description: "Not authenticated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/auth/refresh": {
            post: {
                operationId: "AuthControllerRefresh",
                tags: ["Auth"],
                summary: "Exchange a valid refresh token (httpOnly cookie) for a new access token",
                responses: {
                    "200": {
                        description: "New access token issued",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/MessageResponse" },
                            },
                        },
                    },
                    "401": {
                        description: "Invalid or expired refresh token",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/auth/logout": {
            post: {
                operationId: "AuthControllerLogout",
                tags: ["Auth"],
                summary: "Clear the auth cookies",
                responses: {
                    "200": {
                        description: "Logged out",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/MessageResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/auth/forgot-password": {
            post: {
                operationId: "AuthControllerForgotPassword",
                tags: ["Auth"],
                summary: "Request a password reset link by email",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ForgotPasswordDto" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Reset link sent (always returns OK even if email not found)",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/MessageResponse" },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid request body",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/auth/verify-otp": {
            post: {
                operationId: "AuthControllerVerifyOtp",
                tags: ["Auth"],
                summary: "Verify a password reset OTP code",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/VerifyOtpDto" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "OTP verified successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/MessageResponse" },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid request body or OTP",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/auth/reset-password": {
            post: {
                operationId: "AuthControllerResetPassword",
                tags: ["Auth"],
                summary: "Reset the password using an email and verified OTP",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ResetPasswordDto" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Password reset successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UserResponse" },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid request body or OTP",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/google/status": {
            get: {
                operationId: "GoogleControllerStatus",
                tags: ["Google"],
                summary: "Check whether the current user is connected to Google Calendar",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Google connection status",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/GoogleStatusResponse",
                                },
                            },
                        },
                    },
                    "401": {
                        description: "Not authenticated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/google/connect": {
            get: {
                operationId: "GoogleControllerConnect",
                tags: ["Google"],
                summary: "Redirect the current user to Google's consent screen for calendar access",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "redirect",
                        in: "query",
                        required: false,
                        schema: { type: "string", default: "/settings" },
                        description: "Path to return to after connecting",
                    },
                ],
                responses: {
                    "302": { description: "Redirect to Google's consent screen" },
                    "401": {
                        description: "Not authenticated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/google/connect/callback": {
            get: {
                operationId: "GoogleControllerConnectCallback",
                tags: ["Google"],
                summary: "Google OAuth callback; stores the calendar tokens and redirects to the frontend",
                parameters: [
                    { name: "code", in: "query", required: true, schema: { type: "string" } },
                    { name: "state", in: "query", required: true, schema: { type: "string" } },
                ],
                responses: {
                    "302": { description: "Redirects to the frontend after connecting" },
                },
            },
        },
        "/api/google/disconnect": {
            post: {
                operationId: "GoogleControllerDisconnect",
                tags: ["Google"],
                summary: "Remove the current user's stored Google Calendar account",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Google Calendar disconnected",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/MessageResponse" },
                            },
                        },
                    },
                    "401": {
                        description: "Not authenticated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
        schemas: {
            ErrorResponse: {
                type: "object",
                required: ["success", "message"],
                properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string" },
                },
            },
            MessageResponse: {
                type: "object",
                required: ["success", "message"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                },
            },
            RegisterUserDto: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email", example: "user@example.com" },
                    name: { type: "string", maxLength: 100, example: "Jane Doe" },
                    password: { type: "string", minLength: 8, example: "password123" },
                },
            },
            LoginUserDto: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email", example: "user@example.com" },
                    password: { type: "string", example: "password123" },
                },
            },
            ForgotPasswordDto: {
                type: "object",
                required: ["email"],
                properties: {
                    email: { type: "string", format: "email", example: "user@example.com" },
                },
            },
            VerifyOtpDto: {
                type: "object",
                required: ["email", "otp"],
                properties: {
                    email: { type: "string", format: "email", example: "user@example.com" },
                    otp: { type: "string", minLength: 6, maxLength: 6, example: "123456" },
                },
            },
            ResetPasswordDto: {
                type: "object",
                required: ["email", "otp", "newPassword"],
                properties: {
                    email: { type: "string", format: "email", example: "user@example.com" },
                    otp: { type: "string", minLength: 6, maxLength: 6, example: "123456" },
                    newPassword: { type: "string", minLength: 8, example: "newPassword123" },
                },
            },
            PublicUser: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string", nullable: true },
                    email: { type: "string", format: "email" },
                    username: { type: "string", nullable: true },
                },
                required: ["id", "email"],
            },
            HealthData: {
                type: "object",
                properties: {
                    status: { type: "string", example: "ok" },
                    uptime: { type: "number", example: 123.45 },
                    timestamp: { type: "string", format: "date-time" },
                },
                required: ["status", "uptime", "timestamp"],
            },
            HealthResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/HealthData" },
                },
            },
            UserResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/PublicUser" },
                },
            },
            AuthResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {
                        type: "object",
                        required: ["user", "accessToken"],
                        properties: {
                            user: { $ref: "#/components/schemas/PublicUser" },
                            accessToken: { type: "string" },
                            refreshToken: { type: "string" },
                        },
                    },
                },
            },
            GoogleStatusData: {
                type: "object",
                required: ["connected"],
                properties: {
                    connected: { type: "boolean", example: true },
                    googleEmail: { type: "string", format: "email", nullable: true },
                },
            },
            GoogleStatusResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/GoogleStatusData" },
                },
            },
        },
    },
};