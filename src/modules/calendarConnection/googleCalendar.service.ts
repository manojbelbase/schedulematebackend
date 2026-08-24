import { randomUUID } from "node:crypto";
import { google, type calendar_v3 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { AppError } from "../../common/errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import { logger } from "../../lib/logger";

const CALENDAR_ID = "primary";

export type CalendarEventView = {
    id: string;
    summary: string | null;
    start: string | null;
    end: string | null;
    description: string | null;
    location: string | null;
    meetLink: string | null;
};

function toEventTime(time: calendar_v3.Schema$EventDateTime | undefined): string | null {
    return time?.dateTime ?? time?.date ?? null;
}

function toEventView(event: calendar_v3.Schema$Event): CalendarEventView {
    return {
        id: event.id ?? "",
        summary: event.summary ?? null,
        start: toEventTime(event.start),
        end: toEventTime(event.end),
        description: event.description ?? null,
        location: event.location ?? null,
        meetLink: event.hangoutLink ?? null,
    };
}

function calendarClient(auth: OAuth2Client): calendar_v3.Calendar {
    return google.calendar({
        version: "v3",
        auth: auth as unknown as NonNullable<Parameters<typeof google.calendar>[0]["auth"]>,
    });
}

function toCalendarAppError(err: unknown, context: string): AppError {
    const maybe = err as { code?: number; response?: { status?: number }; message?: string } | null;
    const status = maybe?.code ?? maybe?.response?.status;
    logger.warn({ err, context }, "Google Calendar API request failed");

    switch (status) {
        case httpStatus.NOT_FOUND:
            return new AppError("The requested calendar event could not be found", httpStatus.NOT_FOUND);
        case httpStatus.UNAUTHORIZED:
        case httpStatus.FORBIDDEN:
            return new AppError(
                "Google Calendar rejected the request; the connection may need to be refreshed or reconnected",
                httpStatus.UNAUTHORIZED
            );
        case httpStatus.TOO_MANY_REQUESTS:
            return new AppError("Google Calendar rate limit reached. Please try again shortly", httpStatus.TOO_MANY_REQUESTS);
        case httpStatus.BAD_REQUEST:
            return new AppError("Google Calendar rejected the request because its arguments were invalid", httpStatus.BAD_REQUEST);
        default:
            return new AppError("Could not reach Google Calendar. Please try again later", httpStatus.BAD_GATEWAY);
    }
}

async function withGoogleErrors<T>(context: string, fn: () => Promise<T>): Promise<T> {
    try {
        return await fn();
    } catch (err) {
        throw toCalendarAppError(err, context);
    }
}

export async function listCalendarEvents(
    client: OAuth2Client,
    options: {
        timeMin: string;
        timeMax: string;
        query?: string;
        maxResults?: number;
    }
): Promise<CalendarEventView[]> {
    return withGoogleErrors("listEvents", async () => {
        const res = await calendarClient(client).events.list({
            calendarId: CALENDAR_ID,
            timeMin: options.timeMin,
            timeMax: options.timeMax,
            ...(options.query ? { q: options.query } : {}),
            maxResults: Math.min(Math.max(options.maxResults ?? 25, 1), 100),
            singleEvents: true,
            orderBy: "startTime",
        });

        return (res.data.items ?? [])
            .filter((event) => event.status !== "cancelled" && event.id)
            .map(toEventView);
    });
}

export async function getCalendarEvent(
    client: OAuth2Client,
    eventId: string
): Promise<CalendarEventView> {
    return withGoogleErrors("getEvent", async () => {
        const res = await calendarClient(client).events.get({ calendarId: CALENDAR_ID, eventId });
        const event = res.data;
        if (!event?.id) {
            throw new AppError("The requested calendar event could not be found", httpStatus.NOT_FOUND);
        }
        return toEventView(event);
    });
}

export async function createCalendarEvent(
    client: OAuth2Client,
    input: {
        title: string;
        startTime: string;
        endTime: string;
        description?: string;
        attendees?: string[];
        timeZone?: string;
        meet?: boolean;
    }
): Promise<CalendarEventView> {
    return withGoogleErrors("createEvent", async () => {
        const insertParams: calendar_v3.Params$Resource$Events$Insert = {
            calendarId: CALENDAR_ID,
            sendUpdates: "all",
            requestBody: {
                summary: input.title,
                ...(input.description ? { description: input.description } : {}),
                start: {
                    dateTime: input.startTime,
                    timeZone: input.timeZone ?? "UTC",
                },
                end: {
                    dateTime: input.endTime,
                    timeZone: input.timeZone ?? "UTC",
                },
                ...(input.meet
                    ? {
                        conferenceData: {
                            createRequest: {
                                requestId: randomUUID(),
                                conferenceSolutionKey: { type: "hangoutsMeet" },
                            },
                        },
                    }
                    : {}),
                ...(input.attendees && input.attendees.length > 0
                    ? { attendees: input.attendees.map((email) => ({ email })) }
                    : {}),
            },
        };
        if (input.meet) {
            insertParams.conferenceDataVersion = 1;
        }
        const res = await calendarClient(client).events.insert(insertParams);
        const event = res.data;
        if (!event?.id) {
            throw new AppError("Google did not return the created event", httpStatus.BAD_GATEWAY);
        }
        return toEventView(event);
    });
}

export async function updateCalendarEvent(
    client: OAuth2Client,
    input: {
        eventId: string;
        title?: string;
        startTime?: string;
        endTime?: string;
        description?: string;
        timeZone?: string;
    }
): Promise<CalendarEventView> {
    return withGoogleErrors("updateEvent", async () => {
        const res = await calendarClient(client).events.patch({
            calendarId: CALENDAR_ID,
            eventId: input.eventId,
            sendUpdates: "all",
            requestBody: {
                ...(input.title !== undefined ? { summary: input.title } : {}),
                ...(input.description !== undefined ? { description: input.description } : {}),
                ...(input.startTime !== undefined
                    ? { start: { dateTime: input.startTime, timeZone: input.timeZone ?? "UTC" } }
                    : {}),
                ...(input.endTime !== undefined
                    ? { end: { dateTime: input.endTime, timeZone: input.timeZone ?? "UTC" } }
                    : {}),
            },
        });
        const event = res.data;
        if (!event?.id) {
            throw new AppError("Google did not return the updated event", httpStatus.BAD_GATEWAY);
        }
        return toEventView(event);
    });
}

export async function deleteCalendarEvent(
    client: OAuth2Client,
    eventId: string
): Promise<{ id: string }> {
    await withGoogleErrors("deleteEvent", async () => {
        await calendarClient(client).events.delete({ calendarId: CALENDAR_ID, eventId });
    });
    return { id: eventId };
}
