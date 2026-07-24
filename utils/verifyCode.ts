import type { IUser } from "../lib/types/user.ts";

type VerifyCodeType = "email" | "reset-password";

interface VerifyCodeResult {
    success: boolean;
    message: string;
}

export function verifyCode(
    userInfo: IUser,
    code: string,
    type: VerifyCodeType
): VerifyCodeResult {

    let savedCode: string | undefined;
    let expiryDate: Date | undefined;

    if (type === "email") {
        savedCode = userInfo.verificationCode;
        expiryDate = userInfo.verificationCodeExpiary;
    }

    if (type === "reset-password") {
        savedCode = userInfo.passwordResetCode;
        expiryDate = userInfo.passwordResetCodeExpiry;
    }

    if (!savedCode || !expiryDate) {
        return {
            success: false,
            message: "Verification code not found",
        };
    }

    if (savedCode !== code) {
        return {
            success: false,
            message: "Invalid verification code",
        };
    }

    if (new Date() > expiryDate) {
        return {
            success: false,
            message: "Verification code expired",
        };
    }

    return {
        success: true,
        message: "Verification successful",
    };
}