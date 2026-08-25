export interface ListQueryOptions {
    page: number;
    take: number;
    sortBy: string;
    sortOrder: "ASC" | "DESC";
    query?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface ParseListQueryOptions {
    defaultSortBy?: string;
    defaultSortOrder?: "ASC" | "DESC";
    defaultPage?: number;
    defaultTake?: number;
    maxTake?: number;
}

export interface Pagination {
    previousPage: number | null;
    nextPage: number | null;
    total: number;
    count: number;
}

const DEFAULT_PAGE = 0;
const DEFAULT_TAKE = 10;
const MAX_TAKE = 100;

export const paginationQueryParams = [
    {
        name: "page",
        in: "query",
        required: false,
        schema: { type: "number", default: 0 },
        description: "0-indexed page number",
    },
    {
        name: "take",
        in: "query",
        required: false,
        schema: { type: "number", default: 10 },
        description: "Number of records per page",
    },
    {
        name: "query",
        in: "query",
        required: false,
        schema: { type: "string" },
        description: "Search string",
    },
    {
        name: "dateFrom",
        in: "query",
        required: false,
        schema: { type: "string", format: "date-time" },
        description: "Filter records created at or after this date",
    },
    {
        name: "dateTo",
        in: "query",
        required: false,
        schema: { type: "string", format: "date-time" },
        description: "Filter records created at or before this date",
    },
];

export function parseListQuery(query: Record<string, unknown>, options: ParseListQueryOptions = {}): ListQueryOptions {
    const {
        defaultSortBy = "createdAt",
        defaultSortOrder = "DESC",
        defaultPage = DEFAULT_PAGE,
        defaultTake = DEFAULT_TAKE,
        maxTake = MAX_TAKE,
    } = options;

    const page = parseNonNegativeInt(query.page, defaultPage);
    const take = Math.min(parsePositiveInt(query.take, defaultTake), maxTake);

    let sortBy = defaultSortBy;
    if (typeof query.sortBy === "string" && query.sortBy !== "undefined") {
        sortBy = query.sortBy;
    }

    let sortOrder = defaultSortOrder;
    if (typeof query.sortOrder === "string" && query.sortOrder !== "undefined") {
        sortOrder = query.sortOrder === "asc" ? "ASC" : "DESC";
    }

    const parsed: ListQueryOptions = { page, take, sortBy, sortOrder };

    const q = typeof query.query === "string" && query.query !== "undefined" ? query.query : undefined;
    if (q !== undefined) {
        parsed.query = q;
    }
    const dateFrom = parseDateParam(query.dateFrom);
    if (dateFrom !== undefined) {
        parsed.dateFrom = dateFrom;
    }
    const dateTo = parseDateParam(query.dateTo);
    if (dateTo !== undefined) {
        parsed.dateTo = dateTo;
    }

    return parsed;
}

export function buildPagination(total: number, page: number, take: number, count: number): Pagination {
    const totalPages = total === 0 ? 0 : Math.ceil(total / take);
    return {
        previousPage: page > 0 ? page - 1 : null,
        nextPage: page < totalPages - 1 ? page + 1 : null,
        total,
        count,
    };
}

function parsePositiveInt(value: unknown, fallback: number): number {
    if (typeof value !== "string") {
        return fallback;
    }
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
        return fallback;
    }
    return parsed;
}

function parseNonNegativeInt(value: unknown, fallback: number): number {
    if (typeof value !== "string") {
        return fallback;
    }
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
        return fallback;
    }
    return parsed;
}

function parseDateParam(value: unknown): Date | undefined {
    if (typeof value !== "string" || value.trim() === "") {
        return undefined;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }
    return date;
}