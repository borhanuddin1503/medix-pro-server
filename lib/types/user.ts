import type { Types } from "mongoose";

export interface IUser {
    _id: Types.ObjectId;

    name: string;
    email: string;
    password?: string;

    provider: "credentials" | "google";
    googleId?: string;

    image?: string;

    isVerified: boolean;
    verificationCode?: string;
    verificationCodeExpiary?: Date;

    passwordResetCode?: string;
    passwordResetCodeExpiry?: Date;

    refreshToken?: string;
    refreshTokenExpiry?: Date;

    role: "USER" | "ADMIN" | "DOCTOR" | "TECHNOLOGIST";

    createdAt: Date;
    updatedAt: Date;
}