// utils/token.ts

import jwt from "jsonwebtoken";

export const generateAccessToken = (userId: string, role: string) => {
    console.log('generating access token for userId:', userId, 'with role:', role);
    return jwt.sign(
        { userId, role },
        process.env.ACCESS_TOKEN_SECRET!,
        {
            expiresIn: "15m",
        }
    );
};

export const generateRefreshToken = (userId: string) => {
    return jwt.sign(
        { userId },
        process.env.REFRESH_TOKEN_SECRET!,
        {
            expiresIn: "7d",
        }
    );
};