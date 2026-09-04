import rateLimit, { type Options } from "express-rate-limit";
import { httpStatus } from "../../constants/httpStatus";

const FALLBACK_HANDLER: Options["handler"] = (_req, res) => {
    res.status(httpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        message: "Too many requests, please try again later.",
    });
};

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: FALLBACK_HANDLER,
});

export const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: FALLBACK_HANDLER,
});
