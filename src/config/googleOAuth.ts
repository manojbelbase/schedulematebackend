import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { env } from "./env";

export const googleClient = new OAuth2Client(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri
);

export function buildGoogleAuthUrl(state: string, redirectUri: string): string {
    return googleClient.generateAuthUrl({
        access_type: "offline",
        scope: [
            "openid",
            "profile",
            "email",
        ],
        state,
        prompt: "consent",
        redirect_uri: redirectUri,
        include_granted_scopes: true,
    });
}

export async function verifyGoogleCode(code: string): Promise<TokenPayload> {
    const { tokens } = await googleClient.getToken(code);
    if (!tokens.id_token) {
        throw new Error("Google did not return an id_token");
    }
    const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: env.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload) {
        throw new Error("Unable to read Google token payload");
    }
    return payload;
}
