import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { z } from "zod";

export const GET_CALENDAR_EVENTS = "get_calendar_events";
export const CREATE_CALENDAR_EVENT = "create_calendar_event";
export const UPDATE_CALENDAR_EVENT = "update_calendar_event";
export const DELETE_CALENDAR_EVENT = "delete_calendar_event";

export const getCalendarEventsArgsSchema = z.object({
    timeMin: z.string().min(1),
    timeMax: z.string().min(1),
    query: z.string().min(1).max(200).optional(),
    maxResults: z.number().int().min(1).max(50).optional(),
});

export const createCalendarEventArgsSchema = z.object({
    title: z.string().min(1).max(200),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    description: z.string().max(2000).optional(),
    attendees: z.array(z.string().email()).max(20).optional(),
    timeZone: z.string().max(64).optional(),
    meet: z.boolean().optional(),
});

export const updateCalendarEventArgsSchema = z.object({
    eventId: z.string().min(1),
    title: z.string().min(1).max(200).optional(),
    startTime: z.string().min(1).optional(),
    endTime: z.string().min(1).optional(),
    description: z.string().max(2000).optional(),
    timeZone: z.string().max(64).optional(),
});

export const deleteCalendarEventArgsSchema = z.object({
    eventId: z.string().min(1),
});

export type GetCalendarEventsArgs = z.infer<typeof getCalendarEventsArgsSchema>;
export type CreateCalendarEventArgs = z.infer<typeof createCalendarEventArgsSchema>;
export type UpdateCalendarEventArgs = z.infer<typeof updateCalendarEventArgsSchema>;
export type DeleteCalendarEventArgs = z.infer<typeof deleteCalendarEventArgsSchema>;

export const calendarTools: ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: GET_CALENDAR_EVENTS,
            description:
                "Read the user's Google Calendar events within a time range. timeMin and timeMax MUST be ISO 8601 date-times with an explicit timezone offset (the user's local wall-clock time plus their offset, for example 2026-08-23T22:00:00+05:45). The user's offset is given in the system context. Never omit the offset and never convert to UTC yourself. Resolve relative dates like 'today', 'tomorrow' or 'this week' against the current time provided in the system context. Use the optional query to filter events by a keyword.",
            parameters: {
                type: "object",
                properties: {
                    timeMin: {
                        type: "string",
                        description: "Start of the range: user's local wall-clock date-time in their timezone, no offset",
                    },
                    timeMax: {
                        type: "string",
                        description: "End of the range: user's local wall-clock date-time in their timezone, no offset",
                    },
                    query: {
                        type: "string",
                        description:
                            "Optional free-text filter matching event title or description",
                    },
                    maxResults: {
                        type: "integer",
                        minimum: 1,
                        maximum: 50,
                        description: "Maximum number of events to return (default 25)",
                    },
                },
                required: ["timeMin", "timeMax"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: CREATE_CALENDAR_EVENT,
            description:
                "Create a new event on the user's Google Calendar. startTime and endTime MUST be ISO 8601 date-times with an explicit timezone offset: the user's local wall-clock time plus their offset (for example 2026-08-23T22:00:00+05:45 for 10:00 PM in Nepal). Do NOT convert to UTC yourself and NEVER omit the offset. The backend will normalize the instant into the user's timezone. Only call after you have the title and both start and end times; otherwise ask the user for the missing details. If the user wants a video meeting, set meet to true to add a Google Meet link.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string", description: "Event title" },
                    startTime: {
                        type: "string",
                        description: "Start date-time, ISO 8601 WITH explicit timezone offset or Z (never omit the offset)",
                    },
                    endTime: {
                        type: "string",
                        description: "End date-time, ISO 8601 WITH explicit timezone offset or Z (never omit the offset)",
                    },
                    description: { type: "string", description: "Optional description" },
                    attendees: {
                        type: "array",
                        items: { type: "string", format: "email" },
                        description: "Optional attendee email addresses",
                    },
                    timeZone: {
                        type: "string",
                        description:
                            "IANA timezone name (for example Asia/Kathmandu), otherwise the user's timezone is used",
                    },
                    meet: {
                        type: "boolean",
                        description:
                            "Set to true to attach a Google Meet link to the event; otherwise omit",
                    },
                },
                required: ["title", "startTime", "endTime"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: UPDATE_CALENDAR_EVENT,
            description:
                "Update an existing event on the user's Google Calendar. eventId must be an exact Google Calendar event id obtained from get_calendar_events. Never guess or invent an id. If you do not have the id, first call get_calendar_events with a suitable query to find it. Provide at least one field to change. startTime and endTime, if provided, MUST be ISO 8601 with an explicit timezone offset (user's local wall-clock plus their offset); never omit the offset and never convert to UTC yourself.",
            parameters: {
                type: "object",
                properties: {
                    eventId: { type: "string", description: "The exact Google Calendar event id" },
                    title: { type: "string", description: "New event title" },
                    startTime: {
                        type: "string",
                        description: "New start date-time, ISO 8601 WITH explicit timezone offset or Z (never omit the offset)",
                    },
                    endTime: {
                        type: "string",
                        description: "New end date-time, ISO 8601 WITH explicit timezone offset or Z (never omit the offset)",
                    },
                    description: { type: "string", description: "New description" },
                    timeZone: {
                        type: "string",
                        description: "IANA timezone name for the new times",
                    },
                },
                required: ["eventId"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: DELETE_CALENDAR_EVENT,
            description:
                "Delete an event from the user's Google Calendar. eventId must be an exact Google Calendar event id obtained from get_calendar_events. Never guess or invent an id. Always confirm with the user before deleting; if the user has not explicitly confirmed, ask instead of calling this tool. If ambiguous, ask which event they mean.",
            parameters: {
                type: "object",
                properties: {
                    eventId: { type: "string", description: "The exact Google Calendar event id" },
                },
                required: ["eventId"],
                additionalProperties: false,
            },
        },
    },
];
