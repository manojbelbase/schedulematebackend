import type { AuthContext } from "../common/middleware/auth";

declare global {
    namespace Express {
        interface Request {
            user?: AuthContext;
        }
    }
}

export {};
