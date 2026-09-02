import { AppDataSource } from "../../config/data-source";
import { ChatConversation } from "./chat-conversation.entity";
import { ChatMessage } from "./chat-message.entity";

const conversationRepository = AppDataSource.getRepository(ChatConversation);
const messageRepository = AppDataSource.getRepository(ChatMessage);

export async function createConversation(
    userId: string,
    title?: string
): Promise<ChatConversation> {
    const conversation = conversationRepository.create({
        userId,
        title: title ?? "New conversation",
    });
    return await conversationRepository.save(conversation);
}

export async function listConversationsByUser(userId: string): Promise<ChatConversation[]> {
    return await conversationRepository.find({
        where: { userId },
        order: { updatedAt: "DESC" },
    });
}

export async function findConversationForUser(
    id: string,
    userId: string
): Promise<ChatConversation | null> {
    return await conversationRepository.findOne({ where: { id, userId } });
}

export async function deleteConversation(id: string): Promise<void> {
    await conversationRepository.delete(id);
}

export async function addMessage(data: {
    conversationId: string;
    role: "user" | "assistant";
    content: string;
}): Promise<ChatMessage> {
    const message = messageRepository.create(data);
    return await messageRepository.save(message);
}

export async function listMessagesByConversation(conversationId: string): Promise<ChatMessage[]> {
    return await messageRepository.find({
        where: { conversationId },
        order: { createdAt: "ASC" },
    });
}

export async function listRecentMessagesByConversation(
    conversationId: string,
    take: number
): Promise<ChatMessage[]> {
    const messages = await messageRepository.find({
        where: { conversationId },
        order: { createdAt: "DESC" },
        take,
    });
    return messages.reverse();
}

export async function touchConversation(id: string): Promise<void> {
    await conversationRepository
        .createQueryBuilder()
        .update(ChatConversation)
        .set({ updatedAt: () => "NOW()" })
        .where("id = :id", { id })
        .execute();
}

export async function renameConversation(id: string, title: string): Promise<void> {
    await conversationRepository.update(id, { title });
}