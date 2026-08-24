import { AppError } from "../../../common/errors/AppError";
import { logger } from "../../../lib/logger";
import { toCalendarDateTime } from "../../../common/utils/timezone";
import { getOAuthClientForUser } from "../../calendarConnection/calendarConnection.service";
import {
    createCalendarEvent,
    deleteCalendarEvent,
    getCalendarEvent,
    listCalendarEvents,
    updateCalendarEvent,
} from "../../calendarConnection/googleCalendar.service";
import type { z } from "zod";
import {
    CREATE_CALENDAR_EVENT,
    createCalendarEventArgsSchema,
    DELETE_CALENDAR_EVENT,
    deleteCalendarEventArgsSchema,
    GET_CALENDAR_EVENTS,
    getCalendarEventsArgsSchema,
    UPDATE_CALENDAR_EVENT,
    updateCalendarEventArgsSchema,
    type CreateCalendarEventArgs,
    type DeleteCalendarEventArgs,
    type GetCalendarEventsArgs,
    type UpdateCalendarEventArgs,
} from "./calendarTools";

export type ToolExecutionContext = Record<string, never>;

export type ToolExecutionResult =
    | { ok: true; data: unknown }
    | { ok: false; error: string };

function invalidArguments(toolName: string, error: z.ZodError): ToolExecutionResult {
    const issues = error.issues;
    const detail = issues[0]
        ? `${issues[0].path.map(String).join(".")}: ${issues[0].message}`
        : "validation failed";
    logger.warn({ error }, `Tool ${toolName} received invalid arguments`);
    return { ok: false, error: `Invalid arguments for ${toolName} (${detail})` };
}

function parseArgs(
    toolName: string,
    schema: z.ZodType<unknown>,
    rawArgs: unknown
): ToolExecutionResult | { ok: true; data: unknown } {
    const parsed = schema.safeParse(rawArgs);
    if (!parsed.success) {
        return invalidArguments(toolName, parsed.error);
    }
    return { ok: true, data: parsed.data };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseIsoDateTime(value: string, field: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`${field} is not a valid ISO 8601 date-time`);
    }
    return date.toISOString();
}

function resolveEventTime(value: string, field: string, timeZone?: string): { localDateTime: string; timeZone: string } {
    try {
        return toCalendarDateTime(value, timeZone);
    } catch {
        throw new Error(`${field} is not a valid ISO 8601 date-time`);
    }
}

function toOrderable(localDateTime: string): number {
    return Date.parse(`${localDateTime}Z`);
}

async function runWithGuards(fn: () => Promise<ToolExecutionResult>): Promise<ToolExecutionResult> {
    try {
        return await fn();
    } catch (err) {
        if (err instanceof AppError) {
            return { ok: false, error: err.message };
        }
        if (err instanceof Error) {
            return { ok: false, error: err.message };
        }
        logger.error({ err }, "Calendar tool execution failed");
        return { ok: false, error: "An unexpected error occurred while accessing the calendar" };
    }
}

export async function executeCalendarTool(
    userId: string,
    toolName: string,
    rawArgs: unknown,
    _context: ToolExecutionContext = {}
): Promise<ToolExecutionResult> {
    const name = toolName;

    if (!isPlainObject(rawArgs)) {
        return { ok: false, error: `Arguments for ${name} must be a JSON object` };
    }

    switch (name) {
        case GET_CALENDAR_EVENTS: {
            const parsed = parseArgs(name, getCalendarEventsArgsSchema, rawArgs);
            if (!parsed.ok) return parsed;
            const { timeMin, timeMax, query, maxResults } = parsed.data as GetCalendarEventsArgs;
            return runWithGuards(async () => {
                const client = await getOAuthClientForUser(userId);
                const start = parseIsoDateTime(timeMin, "timeMin");
                const end = parseIsoDateTime(timeMax, "timeMax");
                if (new Date(end).getTime() <= new Date(start).getTime()) {
                    return { ok: false, error: "timeMax must be later than timeMin" };
                }
                const listOptions: {
                    timeMin: string;
                    timeMax: string;
                    query?: string;
                    maxResults?: number;
                } = { timeMin: start, timeMax: end };
                if (query !== undefined) listOptions.query = query;
                if (maxResults !== undefined) listOptions.maxResults = maxResults;
                const events = await listCalendarEvents(client, listOptions);
                return { ok: true, data: { events, count: events.length } };
            });
        }

        case CREATE_CALENDAR_EVENT: {
            const parsed = parseArgs(name, createCalendarEventArgsSchema, rawArgs);
            if (!parsed.ok) return parsed;
            const { title, startTime, endTime, description, attendees, timeZone, meet } =
                parsed.data as CreateCalendarEventArgs;
            return runWithGuards(async () => {
                const client = await getOAuthClientForUser(userId);
                const start = resolveEventTime(startTime, "startTime", timeZone);
                const end = resolveEventTime(endTime, "endTime", timeZone);
                if (toOrderable(end.localDateTime) <= toOrderable(start.localDateTime)) {
                    return { ok: false, error: "endTime must be later than startTime" };
                }
                const conflicts = await listCalendarEvents(client, {
                    timeMin: new Date(toOrderable(start.localDateTime)).toISOString(),
                    timeMax: new Date(toOrderable(end.localDateTime)).toISOString(),
                });
                if (conflicts.length > 0) {
                    return {
                        ok: false,
                        error:
                            `The user already has ${conflicts.length} event(s) that overlap this time: ` +
                            conflicts
                                .map((e) => `"${e.summary ?? "Untitled"}" from ${e.start} to ${e.end}`)
                                .join("; ") +
                            `. Do NOT create the event. Suggest an alternative free time.`,
                    };
                }
                const createInput: {
                    title: string;
                    startTime: string;
                    endTime: string;
                    description?: string;
                    attendees?: string[];
                    timeZone?: string;
                    meet?: boolean;
                } = { title, startTime: start.localDateTime, endTime: end.localDateTime };
                createInput.timeZone = start.timeZone;
                if (description !== undefined) createInput.description = description;
                if (attendees !== undefined) createInput.attendees = attendees;
                if (meet !== undefined) createInput.meet = meet;
                const event = await createCalendarEvent(client, createInput);
                return { ok: true, data: { event } };
            });
        }

        case UPDATE_CALENDAR_EVENT: {
            const parsed = parseArgs(name, updateCalendarEventArgsSchema, rawArgs);
            if (!parsed.ok) return parsed;
            const { eventId, title, startTime, endTime, description, timeZone } =
                parsed.data as UpdateCalendarEventArgs;
            if (
                title === undefined &&
                startTime === undefined &&
                endTime === undefined &&
                description === undefined
            ) {
                return {
                    ok: false,
                    error: "At least one of title, startTime, endTime or description must be provided to update",
                };
            }
            return runWithGuards(async () => {
                const client = await getOAuthClientForUser(userId);
                await getCalendarEvent(client, eventId);
                const update: {
                    eventId: string;
                    title?: string;
                    startTime?: string;
                    endTime?: string;
                    description?: string;
                    timeZone?: string;
                } = { eventId };
                if (title !== undefined) update.title = title;
                if (description !== undefined) update.description = description;
                if (timeZone !== undefined) update.timeZone = timeZone;
                if (startTime !== undefined) {
                    const resolved = resolveEventTime(startTime, "startTime", timeZone);
                    update.startTime = resolved.localDateTime;
                    update.timeZone = resolved.timeZone;
                }
                if (endTime !== undefined) {
                    const resolved = resolveEventTime(endTime, "endTime", timeZone);
                    update.endTime = resolved.localDateTime;
                    update.timeZone = resolved.timeZone;
                }
                const event = await updateCalendarEvent(client, update);
                return { ok: true, data: { event } };
            });
        }

        case DELETE_CALENDAR_EVENT: {
            const parsed = parseArgs(name, deleteCalendarEventArgsSchema, rawArgs);
            if (!parsed.ok) return parsed;
            const { eventId } = parsed.data as DeleteCalendarEventArgs;
            return runWithGuards(async () => {
                const client = await getOAuthClientForUser(userId);
                await getCalendarEvent(client, eventId);
                const result = await deleteCalendarEvent(client, eventId);
                return { ok: true, data: { event: result } };
            });
        }

        default:
            logger.warn({ toolName: name }, "Tool not recognized");
            return { ok: false, error: `Tool "${name}" is not available` };
    }
}
