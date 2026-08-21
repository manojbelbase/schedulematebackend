import { getOpenRouterClient } from "../../config/openrouter";
import { env } from "../../config/env";
import { SYSTEM_PROMPT } from "./system.prompt";

type LlmMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

export type ChatTurn = {
    role: "user" | "assistant";
    content: string;
};

export async function streamChatReply(
    messages: ChatTurn[],
    onDelta: (text: string) => void | Promise<void>
): Promise<string> {
    const client = getOpenRouterClient();
    const llmMessages: LlmMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    let fullText = "";
    try {
        const stream = await client.chat.completions.create({
            model: env.openrouterModel,
            messages: llmMessages,
            stream: true,
        });
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
                fullText += delta;
                await onDelta(delta);
            }
        }
    } catch {
        // Some models do not support streaming; fall back to a plain completion.
    }

    if (!fullText.trim()) {
        const completion = await client.chat.completions.create({
            model: env.openrouterModel,
            messages: llmMessages,
        });
        const text = completion.choices[0]?.message?.content ?? "";
        if (text) {
            fullText = text;
            await onDelta(text);
        }
    }

    return fullText.trim() || "I'm not sure how to respond to that.";
}