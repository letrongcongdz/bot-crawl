import { AppError } from "./AppError.ts";

export class DataNotFoundException extends AppError {
    constructor(message: string) {
        super(message, 404);
    }
}