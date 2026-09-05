import type { Request, Response } from "express";
import { User } from "../../models/user/user.model.ts";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken } from "../../utils/token.ts";
import bcrypt from "bcryptjs";
import nodemailer from 'nodemailer';
import { verifyCode } from "../../utils/verifyCode.ts";
import crypto from "crypto";


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT as string),
    secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function whoMe(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;

        console.log('recieve request to who me')


        const accessToken = token?.split(" ")[1]; // "Bearer <token>" থেকে token আলাদা করা

        if (!accessToken) {
            return res.status(401).json({
                isSuccess: false,
                message: "Unauthorized",
            });
        }

        let decodedData: { userId: string; };

        try {
            decodedData = jwt.verify(
                accessToken,
                process.env.ACCESS_TOKEN_SECRET as string
            ) as { userId: string };
        } catch (err) {
            // token invalid, expired, বা tampered
            return res.status(401).json({
                isSuccess: false,
                message: "Invalid or expired token",
            });
        }

        console.log('decoded data from who me', decodedData)

        const user = await User.findById(decodedData.userId).select(
            "-password -refreshToken -verificationToken -passwordResetToken"
        );

        if (!user) {
            return res.status(404).json({
                isSuccess: false,
                message: "User not found",
            });
        }

        return res.json({
            isSuccess: true,
            user,
        });
    } catch (error) {
        console.error("whoMe error:", error);
        return res.status(500).json({
            isSuccess: false,
            message: "Internal Server Error",
        });
    }
}



// google login
export async function LoginWithGoogle(req: Request, res: Response) {
    try {
        const { googleId, email, name, image, isVerified } = req.body;

        console.log('google login request', googleId, email, name, image, isVerified)

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        if (!googleId) {
            return res.status(400).json({
                success: false,
                message: "Google ID is required",
            });
        }

        // Password field ও লাগবে যদি DB তে existing user check করতে হয়
        let user = await User.findOne({ email });

        if (!user) {
            // ইউজার নেই — নতুন Google user create করো
            user = await User.create({
                name,
                email,
                image,
                googleId,
                provider: "google",
                role: 'USER',
                isVerified, // Google verify করে দিয়েছে, তাই সরাসরি true
            });
        } else {
            // যদি আগে Google দিয়েই signup করা থাকে, কিন্তু googleId না থাকে (edge case)
            if (!user.googleId) {
                user.googleId = googleId;
                user.image = image ?? user.image;
                await user.save();
            }
        }

        // Access Token generate  (short-lived)
        const accessToken = generateAccessToken((user._id).toString(), user.role);

        // Refresh Token generate  (long-lived)
        const refreshToken = generateRefreshToken((user._id).toString());

        // Refresh token DB তে save করো (logout-all-devices/rotation এর জন্য দরকার হবে)
        user.refreshToken = refreshToken;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
                isVerified: user?.isVerified || null,
            },
        });
    } catch (error) {
        console.error("Google login error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong during Google login",
        });
    }
}



// login with credentials route
export async function registrationWithCredentials(req: Request, res: Response) {
    try {
        const { name, email, password, image } = req.body;
        console.log(name, email, password, image)

        // 1️⃣ Input Validation
        if (!name || !email || !password || !image) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }

        // 2️⃣ Duplicate Check
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            if (existingUser.provider === "google") {
                return res.status(409).json({
                    success: false,
                    message:
                        "This email is already registered with Google. Please sign in with Google.",
                });
            }

            return res.status(409).json({
                success: false,
                message: "Email already registered. Please sign in instead.",
            });
        }

        // 3️⃣ Password Hash করা
        const hashedPassword = await bcrypt.hash(password, 10);


        // 5️⃣ User Create করা
        const newUser = await User.create({
            name,
            image,
            email: email.toLowerCase(),
            password: hashedPassword,
            provider: "credentials",
            isVerified: false,
            role: 'USER',
            verificationCodeExpiary: new Date(Date.now() + 5 * 60 * 1000)
        });



        // sendVerificationEmail(newUser.email, verificationToken);
        // 4️⃣ Email Verification code 
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();


        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: email,
            subject: "Email Verification for medix-pro", // subject line
            text: `Your verification code is: ${verificationCode}`, // plain text body
            html: `<p style="font-family: Arial, sans-serif; font-size: 16px; color: green; text-align: center;">Your verification code is: <br><strong>${verificationCode}</strong></p>`,
        });

        newUser.verificationCode = verificationCode;


        // 6️⃣ Access + Refresh Token Generate করা (যদি signup এর পরই auto-login করাতে চাও)
        // Access Token generate  (short-lived)
        const accessToken = generateAccessToken((newUser._id).toString(), newUser.role)

        // Refresh Token generate  (long-lived)
        const refreshToken = generateRefreshToken((newUser._id).toString());

        // Refresh token DB তে save করো
        newUser.refreshToken = refreshToken;
        await newUser.save();

        console.log('new user', newUser)

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            accessToken,
            refreshToken,
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                image: newUser.image,
                role: newUser.role,
                isVerified: newUser.isVerified,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong during registration",
        });
    }
}


// refresh token logic
export async function refreshToken(req: Request, res: Response) {
    try {
        const { refreshToken } = req.body;
        console.log('refresh token from server', refreshToken)

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token missing",
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET!
        ) as {
            userId: string;
        };

        const user = await User.findById(decoded.userId);

        console.log('user id', decoded.userId)

        const newAccessToken = generateAccessToken(
            decoded.userId,
            user?.role || "USER"
        );


        const newRefreshToken = generateRefreshToken(
            decoded.userId
        );

        console.log('newAccessToken', newAccessToken)
        console.log('new refresh token', newRefreshToken)

        return res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired refresh token",
        });
    }
};




// verify otp code
export async function verifyEmail(req: Request, res: Response) {
    const { otpForVerify, email } = req.query;
    console.log(otpForVerify, email)

    if (!email || !otpForVerify) {
        return res.status(409).json({
            success: false,
            message: 'email and otp is required'
        })
    }

    try {
        const userInfo = await User.findOne({ email: email.toString() }).select("+verificationCode +verificationCodeExpiary");
        if (!userInfo) {
            return res.status(401).json({
                success: false,
                message: 'email and otp is required'
            })
        }
        const result = verifyCode(
            userInfo,
            otpForVerify.toString(),
            "email"
        );

        console.log('result ', result)
        if (!result.success) {
            return res.status(400).json(result);
        }

        userInfo.isVerified = true;
        userInfo.verificationCode = undefined;
        userInfo.verificationCodeExpiary = undefined;
        await userInfo.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
        });
    } catch (error) {
        return res.status(500).send({
            success: false,
            message: 'Something went wrong'
        })
    }
}



// resend verifcation code
export async function resendVerificationCode(
    req: Request,
    res: Response
) {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required",
        });
    }

    try {
        const user = await User.findOne({
            email: email.toString()
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified",
            });
        }

        // নতুন OTP তৈরি
        const verificationCode = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // 5 মিনিট expiry
        const verificationCodeExpiary = new Date(
            Date.now() + 5 * 60 * 1000
        );

        user.verificationCode = verificationCode;
        user.verificationCodeExpiary =
            verificationCodeExpiary;

        await user.save();

        // তোমার email sending function
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: email.toString(),
            subject: "Email Verification for medix-pro", // subject line
            text: `Your verification code is: ${verificationCode}`, // plain text body
            html: `<p style="font-family: Arial, sans-serif; font-size: 16px; color: green; text-align: center;">Your verification code is: <br><strong>${verificationCode}</strong></p>`,
        });

        return res.status(200).json({
            success: true,
            message: "Verification code sent successfully",
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
}



// signin route
export async function signIn(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required",
        });
    }

    try {
        const user = await User
            .findOne({
                email: email.toLowerCase(),
            })
            .select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: "This account does not use password login",
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const accessToken = generateAccessToken(
            user._id.toString(),
            user.role
        );

        const refreshToken = generateRefreshToken(
            user._id.toString()
        );

        const userObject = user.toObject();

        const { password: hashedPassword, ...userWithoutPassword } = userObject;

        return res.status(200).json({
            success: true,
            message: "Sign in successful",
            accessToken,
            refreshToken,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error("Sign in error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
}




// send otp for reset password
export async function ForgotPassword(req: Request, res: Response) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email.",
            });
        }

        // 6 digit OTP
        const passwordResetCode =
            crypto.randomInt(100000, 1000000).toString();

        // OTP valid for 5 minutes
        const passwordResetCodeExpiry =
            new Date(Date.now() + 5 * 60 * 1000);

        // Save reset data
        user.passwordResetCode = passwordResetCode;
        user.passwordResetCodeExpiry = passwordResetCodeExpiry;

        await user.save();

        // Send OTP email
        await transporter.sendMail({
            from: `"MedixPro" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Password Reset Verification Code",
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>Password Reset Request</h2>

                    <p>
                        Use the following verification code
                        to reset your password:
                    </p>

                    <h1
                        style="
                            letter-spacing: 8px;
                            color: #059669;
                        "
                    >
                        ${passwordResetCode}
                    </h1>

                    <p>
                        This code will expire in
                        <strong>5 minutes</strong>.
                    </p>

                    <p>
                        If you did not request a password reset,
                        you can safely ignore this email.
                    </p>
                </div>
            `,
        });

        return res.status(200).json({
            success: true,
            message: "Password reset code sent successfully.",
        });

    } catch (error) {
        console.error("Password reset error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong.",
        });
    }
};





// reset password route
export const resetPassword = async (req: Request, res: Response) => {
    const { email, otp, newPassword, confirmPassword } = req.body;

    // Required fields check
    if (!email || !otp || !newPassword || !confirmPassword) {
        return res.status(400).json({
            success: false,
            message:
                "Email, OTP, new password and confirm password are required",
        });
    }

    // Password match check
    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "Passwords do not match",
        });
    }

    try {
        // OTP and expiry select করতে হবে
        const user = await User.findOne({ email }).select(
            "+passwordResetCode +passwordResetCodeExpiry"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // OTP check
        if (user.passwordResetCode !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        // OTP expiry check
        if (
            !user.passwordResetCodeExpiry ||
            user.passwordResetCodeExpiry < new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired",
            });
        }

        // New password hash
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Password update
        user.password = hashedPassword;

        // OTP clear করে দিচ্ছি যাতে একই OTP আবার ব্যবহার করতে না পারে
        user.passwordResetCode = undefined;
        user.passwordResetCodeExpiry = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (error) {
        console.error("Reset password error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};