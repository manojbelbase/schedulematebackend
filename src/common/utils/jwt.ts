import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";

export type TokenType = "access" | "refresh";

export type JwtTokenPayload = {
    sub: string;
    email: string;
    jti?: string;
    tokenType: TokenType;
};

type DecodedToken = JwtTokenPayload & JwtPayload;

function signToken(
    payload: JwtTokenPayload,
    tokenType: TokenType
): string {
    const options: SignOptions = {
        expiresIn:
            tokenType === "access"
                ? (env.jwtAccessExpiresIn as Exclude<SignOptions["expiresIn"], undefined>)
                : (env.jwtRefreshExpiresIn as Exclude<SignOptions["expiresIn"], undefined>),
    };

    return jwt.sign({ ...payload, tokenType }, env.jwtSecret, options);
}

export function signAccessToken(payload: Omit<JwtTokenPayload, "tokenType">): string {
    return signToken({ ...payload, tokenType: "access" }, "access");
}

export function signRefreshToken(payload: Omit<JwtTokenPayload, "tokenType">): string {
    return signToken({ ...payload, tokenType: "refresh" }, "refresh");
}

export function verifyAccessToken(token: string): DecodedToken {
    const decoded = jwt.verify(token, env.jwtSecret) as DecodedToken;
    if (decoded.tokenType !== "access") {
        throw new Error("Invalid token type for access token");
    }
    return decoded;
}

export function verifyRefreshToken(token: string): DecodedToken {
    const decoded = jwt.verify(token, env.jwtSecret) as DecodedToken;
    if (decoded.tokenType !== "refresh") {
        throw new Error("Invalid token type for refresh token");
    }
    return decoded;
}
