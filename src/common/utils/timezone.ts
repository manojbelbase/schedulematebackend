export function isValidTimeZone(timeZone: string): boolean {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone });
        return true;
    } catch {
        return false;
    }
}

export function safeResolveTimeZone(timeZone?: string): string {
    return timeZone && isValidTimeZone(timeZone) ? timeZone : "UTC";
}

const NAIVE_DATETIME_RE = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::\d{2})?$/;

type CalendarDateTime = {
    localDateTime: string;
    timeZone: string;
};

function toZoneNaive(instant: Date, zone: string): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: zone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(instant);

    const get = (type: string): string =>
        parts.find((part) => part.type === type)?.value ?? "00";

    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}

export function toCalendarDateTime(value: string, timeZone?: string): CalendarDateTime {
    const zone = safeResolveTimeZone(timeZone);
    const trimmed = value.trim();

    const naive = trimmed.match(NAIVE_DATETIME_RE);
    if (naive) {
        const localDateTime = `${naive[1]}T${naive[2]}:${naive[3]}:00`;
        if (Number.isNaN(new Date(`${localDateTime}Z`).getTime())) {
            throw new Error(`"${trimmed}" is not a valid ISO 8601 date-time`);
        }
        return { localDateTime, timeZone: zone };
    }

    const instant = new Date(trimmed);
    if (Number.isNaN(instant.getTime())) {
        throw new Error(`"${trimmed}" is not a valid ISO 8601 date-time`);
    }
    return { localDateTime: toZoneNaive(instant, zone), timeZone: zone };
}

export function localDateTimeToUtc(localDateTime: string, zone: string): Date {
    if (Number.isNaN(new Date(`${localDateTime}Z`).getTime())) {
        throw new Error(`"${localDateTime}" is not a valid naive date-time`);
    }
    let guess = Date.parse(`${localDateTime}Z`);
    for (let i = 0; i < 2; i++) {
        const naiveOfGuess = toZoneNaive(new Date(guess), zone);
        const deltaMs = Date.parse(`${localDateTime}Z`) - Date.parse(`${naiveOfGuess}Z`);
        guess += deltaMs;
    }
    return new Date(guess);
}

export function formatNow(zone: string): string {
    return new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date());
}