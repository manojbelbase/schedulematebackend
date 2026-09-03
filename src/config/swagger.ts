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
        { name: "CalendarConnection", description: "Calendar connection endpoints" },
        { name: "AccessRequest", description: "Google calendar access request endpoints" },
        { name: "Chat", description: "AI chat endpoints" },
        { name: "Backoffice", description: "Backoffice endpoints" },
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
                                schema: { $ref: "#/components/schemas/RefreshResponse" },
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
        "/api/calendar-connection/status": {
            get: {
                operationId: "CalendarConnectionControllerGetConnectionStatus",
                tags: ["CalendarConnection"],
                summary: "Check whether the current user is connected to a calendar",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Calendar connection status",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/CalendarConnectionStatusResponse",
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
        "/api/calendar-connection/connect": {
            get: {
                operationId: "CalendarConnectionControllerConnect",
                tags: ["CalendarConnection"],
                summary: "Redirect the current user to Google's consent screen for calendar access",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "redirect",
                        in: "query",
                        required: false,
                        schema: { type: "string", default: "/" },
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
        "/api/calendar-connection/connect/callback": {
            get: {
                operationId: "CalendarConnectionControllerConnectCallback",
                tags: ["CalendarConnection"],
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
        "/api/calendar-connection/disconnect": {
            post: {
                operationId: "CalendarConnectionControllerDisconnect",
                tags: ["CalendarConnection"],
                summary: "Remove the current user's stored calendar connection",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Calendar connection disconnected",
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
        "/api/backoffice/access-requests": {
            get: {
                operationId: "BackofficeAccessRequestControllerList",
                tags: ["Backoffice"],
                summary: "List Google Calendar access requests (admin only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", required: false, schema: { type: "integer", default: 0, minimum: 0 }, description: "Page number (0-indexed)" },
                    { name: "take", in: "query", required: false, schema: { type: "integer", default: 10, minimum: 1, maximum: 100 }, description: "Items per page" },
                    { name: "query", in: "query", required: false, schema: { type: "string" }, description: "Search by requester email or name" },
                    { name: "dateFrom", in: "query", required: false, schema: { type: "string", format: "date-time" }, description: "Filter by createdAt >= dateFrom" },
                    { name: "dateTo", in: "query", required: false, schema: { type: "string", format: "date-time" }, description: "Filter by createdAt <= dateTo" },
                    { name: "sortBy", in: "query", required: false, schema: { type: "string", default: "createdAt" }, description: "Sort field" },
                    { name: "sortOrder", in: "query", required: false, schema: { type: "string", enum: ["ASC", "DESC"], default: "DESC" }, description: "Sort order" },
                ],
                responses: {
                    "200": {
                        description: "Access requests fetched successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/AccessRequestListResponse" },
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
                    "403": {
                        description: "Backoffice access required",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/backoffice/access-requests/{id}/status": {
            patch: {
                operationId: "BackofficeAccessRequestControllerUpdateStatus",
                tags: ["Backoffice"],
                summary: "Update a Google Calendar access request status (admin only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/UpdateAccessRequestStatusDto",
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Access request status updated successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/AccessRequestResponse",
                                },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid status",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
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
                    "403": {
                        description: "Backoffice access required",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                    "404": {
                        description: "Access request not found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/access-request/request-access": {
            post: {
                operationId: "AccessRequestControllerRequestAccess",
                tags: ["AccessRequest"],
                summary:
                    "Submit a Google Calendar access request so the admin can add the user as a Google tester",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RequestAccessDto" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Access request submitted",
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
        "/api/access-request/me": {
            get: {
                operationId: "AccessRequestControllerGetMyAccessRequest",
                tags: ["AccessRequest"],
                summary:
                    "Get the current user's latest Google Calendar access request (status for the UI)",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Latest access request for the current user",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/MyAccessRequestResponse" },
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
        "/api/chat/conversations": {
            get: {
                operationId: "ChatControllerListConversations",
                tags: ["Chat"],
                summary: "List the current user's conversations (sidebar)",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "List of conversations",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ChatConversationListResponse",
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
            post: {
                operationId: "ChatControllerCreateConversation",
                tags: ["Chat"],
                summary: "Create a new conversation",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateConversationDto" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Conversation created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ChatConversationResponse" },
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
        "/api/chat/conversations/{id}": {
            get: {
                operationId: "ChatControllerGetConversation",
                tags: ["Chat"],
                summary: "Get a single conversation with its messages",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Conversation with messages",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ChatConversationResponse",
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
                    "404": {
                        description: "Conversation not found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
            delete: {
                operationId: "ChatControllerDeleteConversation",
                tags: ["Chat"],
                summary: "Delete a conversation and its messages",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Conversation deleted",
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
                    "404": {
                        description: "Conversation not found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/chat/conversations/{id}/messages": {
            get: {
                operationId: "ChatControllerListMessages",
                tags: ["Chat"],
                summary: "Load the messages for a conversation",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "200": {
                        description: "List of messages",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ChatMessageListResponse" },
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
                    "404": {
                        description: "Conversation not found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
            post: {
                operationId: "ChatControllerSendMessage",
                tags: ["Chat"],
                summary: "Send a message and receive a non-streaming reply",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/SendMessageDto" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "User and assistant messages",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ChatSendMessageResponse" },
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
                    "404": {
                        description: "Conversation not found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/backoffice/users": {
            get: {
                operationId: "BackofficeControllerListUsers",
                tags: ["Backoffice"],
                summary: "List all registered users (backoffice only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", required: false, schema: { type: "integer", default: 0, minimum: 0 }, description: "Page number (0-indexed)" },
                    { name: "take", in: "query", required: false, schema: { type: "integer", default: 10, minimum: 1, maximum: 100 }, description: "Items per page" },
                    { name: "query", in: "query", required: false, schema: { type: "string" }, description: "Search by email, name, or username" },
                    { name: "dateFrom", in: "query", required: false, schema: { type: "string", format: "date-time" }, description: "Filter by createdAt >= dateFrom" },
                    { name: "dateTo", in: "query", required: false, schema: { type: "string", format: "date-time" }, description: "Filter by createdAt <= dateTo" },
                    { name: "sortBy", in: "query", required: false, schema: { type: "string", default: "createdAt" }, description: "Sort field" },
                    { name: "sortOrder", in: "query", required: false, schema: { type: "string", enum: ["ASC", "DESC"], default: "DESC" }, description: "Sort order" },
                    { name: "role", in: "query", required: false, schema: { type: "string", enum: ["user", "admin"] }, description: "Filter by user role" },
                ],
                responses: {
                    "200": {
                        description: "Paginated list of users",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/BackofficeUserListResponse" },
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
                    "403": {
                        description: "Backoffice access required",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
            post: {
                operationId: "BackofficeControllerAddUser",
                tags: ["Backoffice"],
                summary: "Add a new user by email (admin only). The user can then set their password via the forgot-password flow.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/AddUserDto" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "User created successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/BackofficeAddUserResponse" },
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
                        description: "Not authenticated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                    "403": {
                        description: "Backoffice access required",
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
        "/api/backoffice/users/{id}": {
            delete: {
                operationId: "BackofficeControllerDeleteUser",
                tags: ["Backoffice"],
                summary: "Delete a user by ID (admin only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "200": {
                        description: "User deleted successfully",
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
                    "403": {
                        description: "Backoffice access required",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                    "404": {
                        description: "User not found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/backoffice/auth/login": {
            post: {
                operationId: "BackofficeAuthControllerLogin",
                tags: ["Backoffice"],
                summary: "Sign in to backoffice with email and password (admin only)",
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
                        description: "Backoffice login successful",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/BackofficeAuthResponse" },
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
                    "403": {
                        description: "Backoffice access denied (not an admin)",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/backoffice/auth/me": {
            get: {
                operationId: "BackofficeAuthControllerMe",
                tags: ["Backoffice"],
                summary: "Get the currently authenticated backoffice user",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Current backoffice user",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/BackofficeUserResponse" },
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
                    "403": {
                        description: "Backoffice access required",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/backoffice/auth/logout": {
            post: {
                operationId: "BackofficeAuthControllerLogout",
                tags: ["Backoffice"],
                summary: "Clear the auth cookies",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Logged out",
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
        "/api/backoffice/llm-config": {
            get: {
                operationId: "LlmConfigControllerListConfigs",
                tags: ["Backoffice"],
                summary: "List LLM configurations (backoffice only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", required: false, schema: { type: "integer", default: 0, minimum: 0 }, description: "Page number (0-indexed)" },
                    { name: "take", in: "query", required: false, schema: { type: "integer", default: 10, minimum: 1, maximum: 100 }, description: "Items per page" },
                    { name: "query", in: "query", required: false, schema: { type: "string" }, description: "Search by config name" },
                    { name: "dateFrom", in: "query", required: false, schema: { type: "string", format: "date-time" }, description: "Filter by createdAt >= dateFrom" },
                    { name: "dateTo", in: "query", required: false, schema: { type: "string", format: "date-time" }, description: "Filter by createdAt <= dateTo" },
                    { name: "sortBy", in: "query", required: false, schema: { type: "string", default: "createdAt" }, description: "Sort field" },
                    { name: "sortOrder", in: "query", required: false, schema: { type: "string", enum: ["ASC", "DESC"], default: "DESC" }, description: "Sort order" },
                ],
                responses: {
                    "200": {
                        description: "Paginated list of LLM configs",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/LlmConfigListResponse" },
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
                    "403": {
                        description: "Backoffice access required",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
            post: {
                operationId: "LlmConfigControllerCreateConfig",
                tags: ["Backoffice"],
                summary: "Create an LLM configuration (backoffice only)",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateLlmConfigDto" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "LLM config created successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/LlmConfigResponse" },
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
                        description: "Not authenticated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                    "403": {
                        description: "Backoffice access required",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/backoffice/llm-config/providers": {
            get: {
                operationId: "LlmConfigControllerListProviders",
                tags: ["Backoffice"],
                summary: "List supported LLM providers for the dropdown (backoffice only)",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Supported LLM providers",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/LlmProviderListResponse" },
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
                    "403": {
                        description: "Backoffice access required",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/backoffice/llm-config/active": {
            get: {
                operationId: "LlmConfigControllerGetActiveConfig",
                tags: ["Backoffice"],
                summary: "Get the active LLM configuration (backoffice only)",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Active LLM config fetched successfully",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/LlmConfigResponse" } } },
                    },
                },
            },
        },
        "/api/backoffice/llm-config/{id}": {
            patch: {
                operationId: "LlmConfigControllerUpdateConfig",
                tags: ["Backoffice"],
                summary: "Update an LLM configuration (backoffice only)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateLlmConfigDto" } } },
                },
                responses: {
                    "200": {
                        description: "LLM config updated successfully",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/LlmConfigResponse" } } },
                    },
                    "400": { description: "Invalid request body", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "LLM config not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
            delete: {
                operationId: "LlmConfigControllerDeleteConfig",
                tags: ["Backoffice"],
                summary: "Delete an LLM configuration (backoffice only)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                responses: {
                    "200": { description: "LLM config deleted successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } } },
                    "404": { description: "LLM config not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/api/backoffice/users/{id}/limit": {
            patch: {
                operationId: "BackofficeControllerUpdateUserLimit",
                tags: ["Backoffice"],
                summary: "Update a user's API request limit (admin only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateUserLimitDto" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "User limit updated successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UserLimitResponse" },
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
                        description: "Not authenticated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                    "403": {
                        description: "Backoffice access required",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                    "404": {
                        description: "User not found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/backoffice/embedding-config": {
            get: {
                operationId: "EmbeddingConfigControllerListConfigs",
                tags: ["Backoffice"],
                summary: "List embedding configurations (backoffice only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", required: false, schema: { type: "integer", default: 0, minimum: 0 }, description: "Page number (0-indexed)" },
                    { name: "take", in: "query", required: false, schema: { type: "integer", default: 10, minimum: 1, maximum: 100 }, description: "Items per page" },
                    { name: "query", in: "query", required: false, schema: { type: "string" }, description: "Search by config name" },
                    { name: "dateFrom", in: "query", required: false, schema: { type: "string", format: "date-time" }, description: "Filter by createdAt >= dateFrom" },
                    { name: "dateTo", in: "query", required: false, schema: { type: "string", format: "date-time" }, description: "Filter by createdAt <= dateTo" },
                    { name: "sortBy", in: "query", required: false, schema: { type: "string", default: "createdAt" }, description: "Sort field" },
                    { name: "sortOrder", in: "query", required: false, schema: { type: "string", enum: ["ASC", "DESC"], default: "DESC" }, description: "Sort order" },
                ],
                responses: {
                    "200": {
                        description: "Paginated list of embedding configs",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/EmbeddingConfigListResponse" },
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
                    "403": {
                        description: "Backoffice access required",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
            post: {
                operationId: "EmbeddingConfigControllerCreateConfig",
                tags: ["Backoffice"],
                summary: "Create an embedding configuration (backoffice only)",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateEmbeddingConfigDto" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Embedding config created successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/EmbeddingConfigResponse" },
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
                        description: "Not authenticated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                    "403": {
                        description: "Backoffice access required",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/backoffice/embedding-config/providers": {
            get: {
                operationId: "EmbeddingConfigControllerListProviders",
                tags: ["Backoffice"],
                summary: "List supported embedding providers for the dropdown (backoffice only)",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Supported embedding providers",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/EmbeddingProviderListResponse" },
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
                    "403": {
                        description: "Backoffice access required",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/backoffice/embedding-config/active": {
            get: {
                operationId: "EmbeddingConfigControllerGetActiveConfig",
                tags: ["Backoffice"],
                summary: "Get the active embedding configuration (backoffice only)",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Active embedding config fetched successfully",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/EmbeddingConfigResponse" } } },
                    },
                },
            },
        },
        "/api/backoffice/embedding-config/{id}": {
            patch: {
                operationId: "EmbeddingConfigControllerUpdateConfig",
                tags: ["Backoffice"],
                summary: "Update an embedding configuration (backoffice only)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateEmbeddingConfigDto" } } },
                },
                responses: {
                    "200": {
                        description: "Embedding config updated successfully",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/EmbeddingConfigResponse" } } },
                    },
                    "400": { description: "Invalid request body", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Embedding config not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
            delete: {
                operationId: "EmbeddingConfigControllerDeleteConfig",
                tags: ["Backoffice"],
                summary: "Delete an embedding configuration (backoffice only)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                responses: {
                    "200": { description: "Embedding config deleted successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } } },
                    "404": { description: "Embedding config not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/api/backoffice/dashboard/users": {
            get: {
                operationId: "BackofficeControllerGetUsersDashboard",
                tags: ["Backoffice"],
                summary: "Get aggregate user, chat, provider and API usage metrics (admin only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "dateFrom", in: "query", required: false, schema: { type: "string", format: "date-time" }, description: "Filter aggregates by createdAt >= dateFrom" },
                    { name: "dateTo", in: "query", required: false, schema: { type: "string", format: "date-time" }, description: "Filter aggregates by createdAt <= dateTo" },
                ],
                responses: {
                    "200": {
                        description: "Users dashboard metrics fetched successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UsersDashboardResponse" },
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
                    "403": {
                        description: "Backoffice access required",
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
            CalendarConnectionStatusData: {
                type: "object",
                required: ["connected"],
                properties: {
                    connected: { type: "boolean", example: true },
                    googleEmail: { type: "string", format: "email", nullable: true },
                },
            },
            CalendarConnectionStatusResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {
                        $ref: "#/components/schemas/CalendarConnectionStatusData",
                    },
                },
            },
            RequestAccessDto: {
                type: "object",
                properties: {
                    message: { type: "string", maxLength: 1000, example: "Please add me as a tester" },
                },
            },
            AccessRequestStatusEnum: {
                type: "string",
                enum: ["pending", "approved", "rejected"],
            },
            AccessRequestData: {
                type: "object",
                required: ["id", "requesterEmail", "status", "createdAt"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    requesterEmail: { type: "string", format: "email" },
                    requesterName: { type: "string", nullable: true },
                    message: { type: "string", nullable: true },
                    status: { $ref: "#/components/schemas/AccessRequestStatusEnum" },
                    createdAt: { type: "string", format: "date-time" },
                    user: {
                        type: "object",
                        nullable: true,
                        properties: {
                            id: { type: "string", format: "uuid" },
                            email: { type: "string", format: "email" },
                            name: { type: "string", nullable: true },
                        },
                    },
                },
            },
            AccessRequestResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/AccessRequestData" },
                },
            },
            AccessRequestListResponse: {
                type: "object",
                required: ["success", "message", "data", "pagination"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/AccessRequestData" },
                    },
                    pagination: {
                        type: "object",
                        required: ["previousPage", "nextPage", "total", "count"],
                        properties: {
                            previousPage: { type: "number", nullable: true },
                            nextPage: { type: "number", nullable: true },
                            total: { type: "number" },
                            count: { type: "number" },
                        },
                    },
                },
            },
            UpdateAccessRequestStatusDto: {
                type: "object",
                required: ["status"],
                properties: {
                    status: { $ref: "#/components/schemas/AccessRequestStatusEnum" },
                },
            },
            MyAccessRequestData: {
                type: "object",
                required: ["id", "status", "createdAt"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    status: { $ref: "#/components/schemas/AccessRequestStatusEnum" },
                    message: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            MyAccessRequestResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {
                        oneOf: [
                            { $ref: "#/components/schemas/MyAccessRequestData" },
                            { type: "null" },
                        ],
                    },
                },
            },
            CreateConversationDto: {
                type: "object",
                properties: {
                    title: { type: "string", maxLength: 255 },
                },
            },
            SendMessageDto: {
                type: "object",
                required: ["content"],
                properties: {
                    content: { type: "string", minLength: 1, maxLength: 10000 },
                    timezone: {
                        type: "string",
                        maxLength: 64,
                        nullable: true,
                        description:
                            "IANA timezone name (e.g. Asia/Kathmandu) for resolving relative dates in chat",
                    },
                    provider: {
                        type: "string",
                        maxLength: 32,
                        nullable: true,
                        description:
                            "LLM provider to use for this message (e.g. deepseek, openrouter). Defaults to the backend-configured provider.",
                    },
                },
            },
            ChatMessage: {
                type: "object",
                required: ["id", "role", "content", "createdAt"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    role: { type: "string", enum: ["user", "assistant"] },
                    content: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            ChatConversation: {
                type: "object",
                required: ["id", "title", "createdAt", "updatedAt"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    title: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            ChatConversationResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {
                        type: "object",
                        required: ["id", "title", "createdAt", "updatedAt", "messages"],
                        properties: {
                            id: { type: "string", format: "uuid" },
                            title: { type: "string" },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                            messages: {
                                type: "array",
                                items: { $ref: "#/components/schemas/ChatMessage" },
                            },
                        },
                    },
                },
            },
            ChatConversationListResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/ChatConversation" },
                    },
                },
            },
            ChatMessageListResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/ChatMessage" },
                    },
                },
            },
            ChatSendMessageResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {
                        type: "object",
                        required: ["userMessage", "assistantMessage", "requestsRemaining"],
                        properties: {
                            userMessage: { $ref: "#/components/schemas/ChatMessage" },
                            assistantMessage: { $ref: "#/components/schemas/ChatMessage" },
                            requestsRemaining: { type: "integer", example: 7 },
                        },
                    },
                },
            },
            PublicUser: {
                type: "object",
                required: ["id", "email"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    email: { type: "string", format: "email" },
                    name: { type: "string", nullable: true },
                    username: { type: "string", nullable: true },
                    role: { type: "string", enum: ["user", "admin"] },
                    apiRequestLimit: { type: "integer", example: 10 },
                    apiRequestsUsed: { type: "integer", example: 3 },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            BackofficeUserListResponse: {
                type: "object",
                required: ["success", "message", "data", "pagination"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/PublicUser" },
                    },
                    pagination: {
                        type: "object",
                        required: ["previousPage", "nextPage", "total", "count"],
                        properties: {
                            previousPage: { type: "integer", nullable: true },
                            nextPage: { type: "integer", nullable: true },
                            total: { type: "integer" },
                            count: { type: "integer" },
                        },
                    },
                },
            },
            BackofficeAuthResponse: {
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
            RefreshResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {
                        type: "object",
                        required: ["accessToken"],
                        properties: {
                            accessToken: { type: "string" },
                            refreshToken: { type: "string" },
                        },
                    },
                },
            },
            BackofficeUserResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/PublicUser" },
                },
            },
            AddUserDto: {
                type: "object",
                required: ["email"],
                properties: {
                    email: { type: "string", format: "email", example: "newuser@example.com" },
                    name: { type: "string", maxLength: 100, example: "Jane Doe" },
                },
            },
            BackofficeAddUserResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/PublicUser" },
                },
            },
            LlmConfigData: {
                type: "object",
                required: ["id", "name", "isActive", "activeProvider", "apiKey", "model", "baseUrl"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string", example: "Production" },
                    isActive: { type: "boolean", example: true },
                    activeProvider: { type: "string", example: "deepseek" },
                    apiKey: { type: "string", example: "sk-..." },
                    model: { type: "string", example: "deepseek-chat" },
                    baseUrl: { type: "string", example: "https://api.deepseek.com" },
                },
            },
            LlmConfigResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/LlmConfigData" },
                },
            },
            LlmConfigListResponse: {
                type: "object",
                required: ["success", "message", "data", "pagination"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/LlmConfigData" },
                    },
                    pagination: {
                        type: "object",
                        required: ["previousPage", "nextPage", "total", "count"],
                        properties: {
                            previousPage: { type: "integer", nullable: true },
                            nextPage: { type: "integer", nullable: true },
                            total: { type: "integer" },
                            count: { type: "integer" },
                        },
                    },
                },
            },
            LlmProvider: {
                type: "object",
                required: ["key", "label", "baseUrl", "defaultModel", "models"],
                properties: {
                    key: { type: "string", example: "deepseek" },
                    label: { type: "string", example: "DeepSeek" },
                    baseUrl: { type: "string", example: "https://api.deepseek.com" },
                    defaultModel: { type: "string", example: "deepseek-v4-flash" },
                    models: {
                        type: "array",
                        items: { type: "string" },
                        example: ["deepseek-v4-flash", "deepseek-v4-pro"],
                    },
                    requiresReferer: { type: "boolean", example: false },
                },
            },
            LlmProviderListResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { type: "array", items: { $ref: "#/components/schemas/LlmProvider" } },
                },
            },
            CreateLlmConfigDto: {
                type: "object",
                required: ["name", "apiKey"],
                properties: {
                    name: { type: "string", minLength: 1, maxLength: 100 },
                    isActive: { type: "boolean" },
                    activeProvider: { type: "string", minLength: 1, maxLength: 100 },
                    apiKey: { type: "string", minLength: 1, maxLength: 500 },
                    model: { type: "string", maxLength: 200 },
                },
            },
            UpdateLlmConfigDto: {
                type: "object",
                properties: {
                    name: { type: "string", minLength: 1, maxLength: 100 },
                    isActive: { type: "boolean" },
                    activeProvider: { type: "string", minLength: 1, maxLength: 100 },
                    apiKey: { type: "string", maxLength: 500 },
                    model: { type: "string", maxLength: 200 },
                    baseUrl: { type: "string", format: "uri", maxLength: 500 },
                },
            },
            EmbeddingConfigData: {
                type: "object",
                required: ["id", "name", "isActive", "activeProvider", "apiKey", "model", "baseUrl", "dimension"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string", example: "Production" },
                    isActive: { type: "boolean", example: true },
                    activeProvider: { type: "string", example: "openrouter" },
                    apiKey: { type: "string", example: "sk-..." },
                    model: { type: "string", example: "openai/text-embedding-3-small" },
                    baseUrl: { type: "string", example: "https://openrouter.ai/api/v1" },
                    dimension: { type: "integer", example: 1536 },
                },
            },
            EmbeddingConfigResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/EmbeddingConfigData" },
                },
            },
            EmbeddingConfigListResponse: {
                type: "object",
                required: ["success", "message", "data", "pagination"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/EmbeddingConfigData" },
                    },
                    pagination: {
                        type: "object",
                        required: ["previousPage", "nextPage", "total", "count"],
                        properties: {
                            previousPage: { type: "integer", nullable: true },
                            nextPage: { type: "integer", nullable: true },
                            total: { type: "integer" },
                            count: { type: "integer" },
                        },
                    },
                },
            },
            EmbeddingProvider: {
                type: "object",
                required: ["key", "label", "baseUrl", "defaultModel", "models", "dimension"],
                properties: {
                    key: { type: "string", example: "openrouter" },
                    label: { type: "string", example: "OpenRouter" },
                    baseUrl: { type: "string", example: "https://openrouter.ai/api/v1" },
                    defaultModel: { type: "string", example: "openai/text-embedding-3-small" },
                    models: {
                        type: "array",
                        items: { type: "string" },
                        example: ["openai/text-embedding-3-small", "openai/text-embedding-3-large"],
                    },
                    dimension: { type: "integer", example: 1536 },
                    requiresReferer: { type: "boolean", example: true },
                },
            },
            EmbeddingProviderListResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { type: "array", items: { $ref: "#/components/schemas/EmbeddingProvider" } },
                },
            },
            CreateEmbeddingConfigDto: {
                type: "object",
                required: ["name", "apiKey"],
                properties: {
                    name: { type: "string", minLength: 1, maxLength: 100 },
                    isActive: { type: "boolean" },
                    activeProvider: { type: "string", minLength: 1, maxLength: 100 },
                    apiKey: { type: "string", minLength: 1, maxLength: 500 },
                    model: { type: "string", maxLength: 200 },
                },
            },
            UpdateEmbeddingConfigDto: {
                type: "object",
                properties: {
                    name: { type: "string", minLength: 1, maxLength: 100 },
                    isActive: { type: "boolean" },
                    activeProvider: { type: "string", minLength: 1, maxLength: 100 },
                    apiKey: { type: "string", maxLength: 500 },
                    model: { type: "string", maxLength: 200 },
                    baseUrl: { type: "string", format: "uri", maxLength: 500 },
                },
            },
            UpdateUserLimitDto: {
                type: "object",
                properties: {
                    apiRequestLimit: { type: "integer", minimum: 0, maximum: 100000, example: 10 },
                    resetUsed: { type: "boolean", example: false },
                },
            },
            UserLimitResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {
                        type: "object",
                        required: ["id", "email", "apiRequestLimit", "apiRequestsUsed"],
                        properties: {
                            id: { type: "string", format: "uuid" },
                            email: { type: "string", format: "email" },
                            apiRequestLimit: { type: "integer", example: 10 },
                            apiRequestsUsed: { type: "integer", example: 3 },
                        },
                    },
                },
            },
            UsersDashboardData: {
                type: "object",
                required: [
                    "countByRole",
                    "emailUsers",
                    "googleUsers",
                    "totalApiRequestsUsed",
                    "totalApiRequestLimit",
                    "usageRatio",
                    "countByProvider",
                    "totalChatConversations",
                    "totalChatMessages",
                    "chatMessagesByRole",
                    "googleCalendarConnected",
                    "googleCalendarNotConnected",
                ],
                properties: {
                    countByRole: {
                        type: "object",
                        additionalProperties: { type: "integer" },
                        example: { user: 120, admin: 8 },
                    },
                    emailUsers: { type: "integer", example: 90 },
                    googleUsers: { type: "integer", example: 38 },
                    totalApiRequestsUsed: { type: "integer", example: 5123 },
                    totalApiRequestLimit: { type: "integer", example: 5128 },
                    usageRatio: { type: "number", format: "float", example: 0.999 },
                    countByProvider: {
                        type: "object",
                        additionalProperties: { type: "integer" },
                        example: { deepseek: 3, openrouter: 1 },
                    },
                    totalChatConversations: { type: "integer", example: 412 },
                    totalChatMessages: { type: "integer", example: 8217 },
                    chatMessagesByRole: {
                        type: "object",
                        additionalProperties: { type: "integer" },
                        example: { user: 4100, assistant: 4117 },
                    },
                    googleCalendarConnected: { type: "integer", example: 12 },
                    googleCalendarNotConnected: { type: "integer", example: 108 },
                },
            },
            UsersDashboardResponse: {
                type: "object",
                required: ["success", "message", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/UsersDashboardData" },
                },
            },
        },
    },
};