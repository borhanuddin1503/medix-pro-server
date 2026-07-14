import type { NextFunction, Request, Response } from "express";
import { createAuth } from "../lib/auth.ts";

export const verifyRole = (roles: string[]) => {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {

        try {
            const auth = createAuth();

            const headers = new Headers();

            Object.entries(req.headers).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach((v) => headers.append(key, v));
                } else if (value !== undefined) {
                    headers.set(key, value);
                }
            });


            const session = await auth.api.getSession({
                headers
            });


            if (!session) {
                return res.status(401).json({
                    message: "Unauthorized"
                });
            }


            const user = session.user;


            if (!roles.includes(user.role)) {
                return res.status(403).json({
                    message: "Forbidden Access "
                });
            }


            // attach user for controller use
            req.user = user;

            next();

        } catch (error) {
            return  res.status(500).json({
                message: 'Something went wrong'
            });
        }
    };
};