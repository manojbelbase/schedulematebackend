import type { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import { sendSuccess } from "../../lib/response";
import {
    createNewConversation,
    getConversation,
    getConversationMessages,
    listConversations,
    removeConversation,
    sendMessageNonStreaming,
} from "./chat.service";
import type { CreateConversationDto } from "./dto/create-conversation.dto";
import type { SendMessageDto } from "./dto/send-message.dto";

function requireConversationId(req: Request): string {
    const raw = req.params.id;
    const id = Array.isArray(raw) ? raw[0] : raw;
    if (!id) {
        throw new AppError("Conversation id is required", httpStatus.BAD_REQUEST);
    }
    return id;
}

export async function listConversationsController(
    req: Request,
    res: Response
): Promise<void> {
    if (!req.user) {
        throw new AppError("Not authenticated", httpStatus.UNAUTHORIZED);
    }
    const conversations = await listConversations(req.user.userId);
    sendSuccess(res, httpStatus.OK, "Conversations fetched successfully", conversations);
}

export async function createConversationController(
    req: Request,
    res: Response
): Promise<void> {
    if (!req.user) {
        throw new AppError("Not authenticated", httpStatus.UNAUTHORIZED);
    }
    const { title } = req.body as CreateConversationDto;
    const conversation = await createNewConversation(req.user.userId, title);
    sendSuccess(res, httpStatus.CREATED, "Conversation created successfully", conversation);
}

export async function getConversationController(
    req: Request,
    res: Response
): Promise<void> {
    if (!req.user) {
        throw new AppError("Not authenticated", httpStatus.UNAUTHORIZED);
    }
    const conversationId = requireConversationId(req);
    const conversation = await getConversation(req.user.userId, conversationId);
    sendSuccess(res, httpStatus.OK, "Conversation fetched successfully", conversation);
}

export async function listMessagesController(
    req: Request,
    res: Response
): Promise<void> {
    if (!req.user) {
        throw new AppError("Not authenticated", httpStatus.UNAUTHORIZED);
    }
    const conversationId = requireConversationId(req);
    const messages = await getConversationMessages(req.user.userId, conversationId);
    sendSuccess(res, httpStatus.OK, "Messages fetched successfully", messages);
}

export async function deleteConversationController(
    req: Request,
    res: Response
): Promise<void> {
    if (!req.user) {
        throw new AppError("Not authenticated", httpStatus.UNAUTHORIZED);
    }
    const conversationId = requireConversationId(req);
    await removeConversation(req.user.userId, conversationId);
    sendSuccess(res, httpStatus.OK, "Conversation deleted successfully");
}

export async function sendMessageController(
    req: Request,
    res: Response
): Promise<void> {
    if (!req.user) {
        throw new AppError("Not authenticated", httpStatus.UNAUTHORIZED);
    }
    const conversationId = requireConversationId(req);
    const { content, timezone, provider } = req.body as SendMessageDto;
    const result = await sendMessageNonStreaming(
        req.user.userId,
        conversationId,
        content,
        timezone,
        provider
    );
    sendSuccess(res, httpStatus.OK, "Message sent successfully", result);
}