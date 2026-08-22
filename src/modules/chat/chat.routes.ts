import { Router } from "express";
import { asyncHandler } from "../../common/middleware/asyncHandler";
import { authenticate } from "../../common/middleware/auth";
import { validateBody } from "../../common/middleware/validateBody";
import { createConversationSchema } from "./dto/create-conversation.dto";
import { sendMessageSchema } from "./dto/send-message.dto";
import {
    createConversationController,
    deleteConversationController,
    getConversationController,
    listConversationsController,
    listMessagesController,
    sendMessageController,
} from "./chat.controller";

export const chatRouter: Router = Router();

chatRouter.use(authenticate());

chatRouter.get("/conversations", asyncHandler(listConversationsController));
chatRouter.post(
    "/conversations",
    validateBody(createConversationSchema),
    asyncHandler(createConversationController)
);
chatRouter.get("/conversations/:id", asyncHandler(getConversationController));
chatRouter.get("/conversations/:id/messages", asyncHandler(listMessagesController));
chatRouter.delete("/conversations/:id", asyncHandler(deleteConversationController));
chatRouter.post(
    "/conversations/:id/messages",
    validateBody(sendMessageSchema),
    asyncHandler(sendMessageController)
);