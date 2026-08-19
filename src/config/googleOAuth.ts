import { OAuth2Client, type Credentials, type TokenPayload } from "google-auth-library";
import { env } from "./env";

export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
export const GOOGLE_LOGIN_SCOPES = ["openid", "profile", "email"];
export const GOOGLE_CONNECT_SCOPES = ["openid", "profile", "email", GOOGLE_CALENDAR_SCOPE];

export const googleClient = new OAuth2Client(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri
);

export function buildGoogleAuthUrl(state: string, redirectUri: string): string {
    return googleClient.generateAuthUrl({
        access_type: "offline",
        scope: GOOGLE_LOGIN_SCOPES,
        state,
        prompt: "consent",
        redirect_uri: redirectUri,
        include_granted_scopes: true,
    });
}

export function buildGoogleConnectAuthUrl(state: string, redirectUri: string): string {
    return googleClient.generateAuthUrl({
        access_type: "offline",
        scope: GOOGLE_CONNECT_SCOPES,
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

export async function getGoogleCredentials(
    code: string,
    redirectUri: string
): Promise<{ credentials: Credentials; email?: string }> {
    const client = new OAuth2Client(env.googleClientId, env.googleClientSecret, redirectUri);
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const email = tokens.id_token
        ? (await client.verifyIdToken({ idToken: tokens.id_token, audience: env.googleClientId }))
              .getPayload()?.email
        : undefined;

    return email
        ? { credentials: tokens, email }
        : { credentials: tokens };
}
