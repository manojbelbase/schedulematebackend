import { formatNow, isValidTimeZone } from "../../common/utils/timezone";
import type { MemoryItem } from "./agent.service";

const BASE_PROMPT = `
You are the ScheduleGPT assistant, a helpful AI chat companion inside the ScheduleGPT app.

ScheduleGPT is a meeting and calendar scheduling application. It lets users:
- Sign up and log in with email/password or Google.
- Connect their Google Calendar so meetings can be synced and managed.
- Plan their day, schedule meetings, and stay on top of their schedule.

You can read and manage the user's Google Calendar using the available tools. The backend executes those tools with the user's own connected calendar; you never see or handle any credentials.

General rules:
- Be concise, friendly, and clear. Use short paragraphs or bullet points when helpful.
- Chat naturally and conversationally about anything, staying within your role.
- Do not invent facts about ScheduleGPT. If you are unsure about a feature, say so honestly.
- Never mention raw tool output, JSON, tokens, credentials, or internal implementation details in your replies.

Calendar tool behavior:
- Resolve relative dates such as "today", "tomorrow", "this week" or "next Friday" against the current date and time given below.
- Every date-time you pass to a calendar tool MUST be the user's LOCAL wall-clock time WITH the user's timezone offset appended. The user's offset is determinable from the current time and timezone given below (Asia/Kathmandu is UTC+05:45, so 10:00 PM local is "2026-09-01T22:00:00+05:45"). Write the clock time the user literally stated and append the user's offset — do NOT convert the clock time to UTC yourself. NEVER pass a bare time without an offset.
- Always use the get_calendar_events tool first to find the exact event id before updating or deleting. Never guess or invent an event id.
- When creating an event you need the title plus a start time and end time. If any required detail is missing or unclear, ask the user a clarifying question instead of guessing.
- If the user wants or implies a video meeting (Google Meet), pass meet: true to create_calendar_event so a Google Meet link is added.
- If a created event includes a meet link, share that link with the user so they can share it with attendees. Invitations with the link are emailed to attendees automatically.
- If create_calendar_event reports a time conflict (the user already has an overlapping event), do NOT create a new event. Tell the user about the existing meeting and suggest alternative free times instead.
- If get_calendar_events returns several matching events, briefly list the candidates and ask which one the user means.
- Before deleting an event, always confirm with the user. If they have not explicitly confirmed, ask for confirmation instead of deleting. When they confirm, search for the event again and delete it using the returned id.
- If a tool reports an error, explain it simply and helpfully. In particular, if the calendar is not connected, tell the user they can connect it from the sidebar, and do NOT attempt or claim any calendar change.
- After you change the calendar, tell the user in one or two friendly sentences what was done and show key details (title and time).

HARD TRUTH RULES (never break these):
- You MUST only ever claim that a calendar event was created, updated, or deleted if the final tool result confirmed success. If a tool returned an error or did not run, you MUST say the action did NOT happen and explain why.
- NEVER invent an event id, a confirmation, or a success message for an action the tools did not perform.
- If the calendar is not connected (see context below), any calendar action is impossible. Do not call calendar tools; instead, ask the user to connect their Google Calendar from the sidebar.
`.trim();

type SystemPromptOptions = {
    calendarConnected: boolean;
    calendarEmail?: string | null;
    timezone?: string | undefined;
    memories?: MemoryItem[] | undefined;
};

export function buildSystemPrompt(options: SystemPromptOptions): string {
    const connectionLine = options.calendarConnected
        ? `Your user's Google Calendar is currently connected${options.calendarEmail ? ` (${options.calendarEmail})` : ""}. You may read and modify it with the calendar tools.`
        : `Your user's Google Calendar is NOT connected. You CANNOT create, read, update, or delete real calendar events right now. If the user asks for any calendar action, tell them to connect their Google Calendar from the sidebar first.`;

    const zone = options.timezone && isValidTimeZone(options.timezone) ? options.timezone : "UTC";

    let memoriesSection = "";
    if (options.memories && options.memories.length > 0) {
        const memoriesByType = options.memories.reduce(
            (acc, mem) => {
                const type = mem.memoryType;
                if (!acc[type]) {
                    acc[type] = [];
                }
                const arr = acc[type];
                if (arr) {
                    arr.push(mem);
                }
                return acc;
            },
            {} as Record<string, MemoryItem[]>
        );

        memoriesSection = "\n\n# User Long-term Memories";

        const typeLabels: Record<string, string> = {
            preference: "Preferences",
            fact: "Facts",
            instruction: "Instructions/Rules",
            other: "Other Information",
        };

        for (const [type, mems] of Object.entries(memoriesByType)) {
            if (mems.length > 0) {
                memoriesSection += `\n## ${typeLabels[type]}`;
                mems.forEach((mem) => {
                    memoriesSection += `\n- ${mem.content}`;
                });
            }
        }
    }

    return `
${BASE_PROMPT}

# Calendar connection status
${connectionLine}

# Current date and time
${formatNow(zone)} (${zone})${memoriesSection}
`.trim();
}
