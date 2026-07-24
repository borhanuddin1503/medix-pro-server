import type { IUser } from "./user.ts";

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

export { };