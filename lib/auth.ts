import { envConfig } from './env-config.ts';
import mongoose from "mongoose";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP } from 'better-auth/plugins';
import nodemailer from "nodemailer";
envConfig();

const getDb = () => {
    const client = mongoose.connection.getClient();
    if (!client) {
        throw new Error('MongoDB client is not initialized yet');
    }

    return client.db(process.env.DB_NAME as string);
};

export const createAuth = () => betterAuth({
    database: mongodbAdapter(getDb() as any),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    plugins: [
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                // Create a transporter using nodemailer SMTP
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT as string),
                    secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });
                if (type === "sign-in") {
                    // Send the OTP for sign in
                } else if (type === "email-verification") {
                    const info = await transporter.sendMail({
                        from: process.env.FROM_EMAIL,
                        to: email,
                        subject: "Email Verification for medix-pro", // subject line
                        text: `Your verification code is: ${otp}`, // plain text body
                        html: `<p style="font-family: Arial, sans-serif; font-size: 16px; color: green; text-align: center;">Your verification code is: <br><strong>${otp}</strong></p>`, // HTML body
                    });
                } else {
                    // Send the OTP for password reset
                    const info = await transporter.sendMail({
                        from: process.env.FROM_EMAIL,
                        to: email,
                        subject: "Reset Password OTP for medix-pro", // subject line
                        text: `Your Reset Password OTP is: ${otp}`, // plain text body
                        html: `<p style="font-family: Arial, sans-serif; font-size: 16px; color: green; text-align: center;">Your Reset Password code is: <br><strong>${otp}</strong></p>`, // HTML body
                    });
                }
            },
        })
    ],

    user: {
        additionalFields: {
            role: {
                type: 'string',
                defaultValue: 'USER'
            }
        }
    },
    trustedOrigins: [process.env.CLIENT_URL!]
});