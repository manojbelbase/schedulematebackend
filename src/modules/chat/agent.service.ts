import type {
    ChatCompletionMessageParam,
    ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";
import { AppError } from "../../common/errors/AppError";
import type { MemoryType } from "./chat-memory.entity";
import {
    getLlmClient,
    getModelForProvider,
    resolveLlmProvider,
} from "../../config/llm";
import { httpStatus } from "../../constants/httpStatus";
import { logger } from "../../lib/logger";
import { getConnectionStatus } from "../calendarConnection/calendarConnection.service";
import { buildSystemPrompt } from "./system.prompt";
import { calendarTools } from "./tools/calendarTools";
import {
    executeCalendarTool,
    type ToolExecutionResult,
} from "./tools/calendarToolExecutor";

const MAX_TOOL_ITERATIONS = 4;

export type ChatTurn = {
    role: "user" | "assistant";
    content: string;
};

export type MemoryItem = {
    content: string;
    memoryType: MemoryType;
};

export type AgentTurnOptions = {
    provider?: string | undefined;
    timezone?: string | undefined;
    memories?: MemoryItem[] | undefined;
    /**
     * When provided, replaces the default ScheduleGPT system prompt entirely.
     * Used for internal LLM sub-tasks such as memory extraction, where we want
     * the model to follow custom instructions (e.g. return strict JSON).
     */
    systemPromptOverride?: string | undefined;
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

async function runSingleToolCall(
    userId: string,
    toolCall: ChatCompletionMessageToolCall,
    timeZone?: string
): Promise<ToolExecutionResult> {
    if (toolCall.type !== "function") {
        return { ok: false, error: "Unsupported tool call type." };
    }
    let rawArgs: unknown;
    try {
        rawArgs = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
    } catch {
        return { ok: false, error: "Tool arguments could not be parsed as JSON." };
    }
    const context = timeZone ? { timeZone } : {};
    return await executeCalendarTool(userId, toolCall.function.name, rawArgs, context);
}

export async function runAgentTurn(
    userId: string,
    history: ChatTurn[],
    options: AgentTurnOptions = {}
): Promise<string> {
    const provider = await resolveLlmProvider(options.provider);
    const client = await getLlmClient(provider);
    const isSubTask = options.systemPromptOverride !== undefined;

    let calendarConnected = false;
    let calendarEmail: string | null = null;
    if (!isSubTask) {
        const connection = await getConnectionStatus(userId);
        calendarConnected = connection.connected;
        calendarEmail = connection.googleEmail;
    }

    const systemPrompt = options.systemPromptOverride
        ? options.systemPromptOverride
        : buildSystemPrompt({
            timezone: options.timezone,
            calendarConnected,
            calendarEmail,
            memories: options.memories,
        });

    const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...history.map(
            (turn): ChatCompletionMessageParam => ({ role: turn.role, content: turn.content })
        ),
    ];

    for (let iteration = 0; iteration < (isSubTask ? 1 : MAX_TOOL_ITERATIONS); iteration++) {
        let completion;
        try {
            completion = await client.chat.completions.create({
                model: await getModelForProvider(provider),
                messages,
                ...(isSubTask
                    ? {}
                    : { tools: calendarTools, tool_choice: "auto" as const }),
            });
        } catch (err) {
            throw toAppError(err);
        }

        const message = completion.choices[0]?.message;
        if (!message) {
            logger.error({ completionId: completion.id }, "AI provider returned no choices");
            throw new AppError(
                "AI returned an empty response. Please try again.",
                httpStatus.BAD_GATEWAY
            );
        }

        if (!message.tool_calls || message.tool_calls.length === 0) {
            const text = message.content?.trim();
            if (!text) {
                logger.error({ completionId: completion.id }, "AI provider returned an empty response");
                throw new AppError(
                    "AI returned an empty response. Please try again.",
                    httpStatus.BAD_GATEWAY
                );
            }
            return text;
        }

        messages.push(message);

        for (const toolCall of message.tool_calls) {
            const toolResult = await runSingleToolCall(userId, toolCall, options.timezone);
            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(toolResult),
            });
        }
    }

    logger.warn({ userId }, "Tool calling loop reached its iteration cap");
    return (
        "I wasn't able to finish working on that calendar request. " +
        "Could you please rephrase it or add a little more detail?"
    );
}
