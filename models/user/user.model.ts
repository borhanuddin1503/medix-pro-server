import { Schema, model } from "mongoose";
import type { IUser } from "../../lib/types/user.ts";

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            select: false, // by default query তে password আসবে না, security ভালো থাকে
        },
        provider: {
            type: String,
            enum: ["credentials", "google"],
            required: true,
            default: "credentials",
        },
        googleId: {
            type: String,
            sparse: true, // unique কিন্তু null value বহুবার থাকতে পারবে (credentials user দের জন্য)
            unique: true,
        },
        image: {
            type: String,
            default: null,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationCode: {
            type: String,
            select: false,
        },
        verificationCodeExpiary: {
            type: Date,
            select: false,
        },
        passwordResetCode: {
            type: String,
            select: false,
        },
        passwordResetCodeExpiry: {
            type: Date,
            select: false,
        },
        refreshToken: {
            type: String,
            select: false,
        },
        role: {
            type: String,
            enum: ["USER", "ADMIN", 'DOCTOR', 'TECHNOLOGIST', 'RECEPTIONIST'],
            default: "USER",
        },
    },
    { timestamps: true } // createdAt, updatedAt automatic
);



export const User = model<IUser>("user-datas", userSchema);