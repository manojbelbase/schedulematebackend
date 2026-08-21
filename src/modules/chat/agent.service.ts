import { AppError } from "../../common/errors/AppError";
import { getOpenRouterClient } from "../../config/openrouter";
import { env } from "../../config/env";
import { httpStatus } from "../../constants/httpStatus";
import { logger } from "../../lib/logger";
import { SYSTEM_PROMPT } from "./system.prompt";

export type ChatTurn = {
    role: "user" | "assistant";
    content: string;
};

function toAppError(err: unknown): AppError {
    const status = (err as { status?: number } | null)?.status;

    if (status === httpStatus.TOO_MANY_REQUESTS) {
        return new AppError(
            "AI provider rate limit exceeded. Please try again in a moment.",
            httpStatus.TOO_MANY_REQUESTS
        );
    }
    if (status === 401 || status === 403) {
        logger.error({ err }, "AI provider rejected the API key");
        return new AppError(
            "AI provider is misconfigured. Please try again later.",
            httpStatus.BAD_GATEWAY
        );
    }

    logger.error({ err }, "AI provider request failed");
    return new AppError(
        "AI provider is currently unavailable. Please try again later.",
        httpStatus.BAD_GATEWAY
    );
}

export async function generateChatReply(messages: ChatTurn[]): Promise<string> {
    const client = getOpenRouterClient();
    const llmMessages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    let completion;
    try {
        completion = await client.chat.completions.create({
            model: env.openrouterModel,
            messages: llmMessages,
        });
    } catch (err) {
        throw toAppError(err);
    }

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
        logger.error({ completionId: completion.id }, "AI provider returned an empty response");
        throw new AppError(
            "AI returned an empty response. Please try again.",
            httpStatus.BAD_GATEWAY
        );
    }

    return text;
}
