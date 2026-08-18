import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env";
import { httpStatus } from "../../constants/httpStatus";

export function docsAuth(req: Request, res: Response, next: NextFunction): void {
    if (env.docsAuthToken === "") {
        next();
        return;
    }

    const header = req.headers.authorization;
    if (!header) {
        deny(res);
        return;
    }
    const [scheme, token] = header.split(" ");
    if (scheme?.toLowerCase() === "basic" && token === env.docsAuthToken) {
        next();
        return;
    }
    deny(res);
}

function deny(res: Response): void {
    res.set("WWW-Authenticate", 'Basic realm="docs"');
    res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
}