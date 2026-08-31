export class AppError extends Error {
    statusCode: number;
    payload?: Record<string, unknown> | undefined;

    constructor(message: string, statusCode: number, payload?: Record<string, unknown>) {
        super(message);
        this.statusCode = statusCode;
        this.payload = payload;
    }
}