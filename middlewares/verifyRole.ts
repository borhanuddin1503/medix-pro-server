import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user/user.model.ts";

export const verifyRole = (roles: string[]) => {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {

            const authHeader = req.headers.authorization;

            let accessToken: string | undefined;

            if (authHeader?.startsWith("Bearer ")) {
                accessToken = authHeader.split(" ")[1];
            } else {
                accessToken = req.cookies.access_token;
            }


            if (!accessToken) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }


            const decoded = jwt.verify(
                accessToken,
                process.env.ACCESS_TOKEN_SECRET!
            ) as {
                userId: string;
            };

            console.log('decoded' , decoded)

            // Database থেকে user খুঁজে বের করা
            const userInfo = await User.findById(decoded.userId);

            if (!userInfo) {
                return res.status(401).json({
                    success: false,
                    message: "User not found",
                });
            }

            // Database-এর role check
            if (!roles.includes(userInfo.role)) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden Access",
                });
            }

            // Controller এ userInfo info use করার জন্য
            req.user = userInfo;

            console.log('user info' , userInfo)

            next();

        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired access token",
            });
        }
    };
};