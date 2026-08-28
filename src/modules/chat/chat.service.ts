import { AppError } from "../../common/errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import {
    addMessage,
    createConversation,
    deleteConversation,
    findConversationForUser,
    listConversationsByUser,
    listMessagesByConversation,
    renameConversation,
    touchConversation,
} from "./chat.repository";
import { runAgentTurn } from "./agent.service";
import { findUserById, incrementRequestCount } from "../users/user.repository";

export type PublicConversation = {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
};

export type PublicMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: Date;
};

function toPublicConversation(c: {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
}): PublicConversation {
    return { id: c.id, title: c.title, createdAt: c.createdAt, updatedAt: c.updatedAt };
}

function toPublicMessage(m: {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: Date;
}): PublicMessage {
    return { id: m.id, role: m.role, content: m.content, createdAt: m.createdAt };
}

export async function listConversations(userId: string): Promise<PublicConversation[]> {
    const conversations = await listConversationsByUser(userId);
    return conversations.map(toPublicConversation);
}

export async function createNewConversation(
    userId: string,
    title?: string
): Promise<PublicConversation & { messages: PublicMessage[] }> {
    const conversation = await createConversation(userId, title);
    return { ...toPublicConversation(conversation), messages: [] };
}

export async function getConversation(
    userId: string,
    conversationId: string
): Promise<PublicConversation & { messages: PublicMessage[] }> {
    const conversation = await findConversationForUser(conversationId, userId);
    if (!conversation) {
        throw new AppError("Conversation not found", httpStatus.NOT_FOUND);
    }
    const messages = await listMessagesByConversation(conversationId);
    return {
        ...toPublicConversation(conversation),
        messages: messages.map(toPublicMessage),
    };
}

export async function getConversationMessages(
    userId: string,
    conversationId: string
): Promise<PublicMessage[]> {
    const conversation = await findConversationForUser(conversationId, userId);
    if (!conversation) {
        throw new AppError("Conversation not found", httpStatus.NOT_FOUND);
    }
    const messages = await listMessagesByConversation(conversationId);
    return messages.map(toPublicMessage);
}

export async function removeConversation(userId: string, conversationId: string): Promise<void> {
    const conversation = await findConversationForUser(conversationId, userId);
    if (!conversation) {
        throw new AppError("Conversation not found", httpStatus.NOT_FOUND);
    }
    await deleteConversation(conversationId);
}

export async function sendMessageNonStreaming(
    userId: string,
    conversationId: string,
    content: string,
    timezone?: string,
    provider?: string
): Promise<{ userMessage: PublicMessage; assistantMessage: PublicMessage; requestsRemaining: number }> {
    const conversation = await findConversationForUser(conversationId, userId);
    if (!conversation) {
        throw new AppError("Conversation not found", httpStatus.NOT_FOUND);
    }

    const user = await findUserById(userId);
    if (!user) {
        throw new AppError("User not found", httpStatus.NOT_FOUND);
    }

    if (user.apiRequestsUsed >= user.apiRequestLimit) {
        throw new AppError(
            "Request limit exceeded. Please upgrade your plan or contact admin.",
            httpStatus.TOO_MANY_REQUESTS
        );
    }

    const userMessage = await addMessage({ conversationId, role: "user", content });
    await touchConversation(conversationId);

    const history = await listMessagesByConversation(conversationId);
    const replyText = await runAgentTurn(
        userId,
        history.map((m) => ({ role: m.role, content: m.content })),
        { timezone, provider }
    );

    await incrementRequestCount(userId);

    const assistantMessage = await addMessage({
        conversationId,
        role: "assistant",
        content: replyText,
    });
    await touchConversation(conversationId);

    if (conversation.title === "New conversation") {
        await renameConversation(conversationId, content.slice(0, 40));
    }

    const requestsRemaining = user.apiRequestLimit - (user.apiRequestsUsed + 1);

    return {
        userMessage: toPublicMessage(userMessage),
        assistantMessage: toPublicMessage(assistantMessage),
        requestsRemaining,
    };
}