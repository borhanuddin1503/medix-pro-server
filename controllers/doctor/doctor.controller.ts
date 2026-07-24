import type { Request, Response } from "express";
import DoctorsApply from "../../models/doctor/apply_doctor.model.ts";
import { ObjectId } from "mongodb";

export async function applyDoctor(req: Request, res: Response) {
    try {
        const information = req.body;
        const userId = req.user?._id;
        const userEmail = req.user?.email;
        const isEmailVerified = req.user?.isVerified;
        
        console.log(userEmail, 'is trying to apply')

        console.log(isEmailVerified)

        if (!isEmailVerified) {
            return res.status(403).json({
                success: false,
                code: "EMAIL_NOT_VERIFIED",
                message: "Please verify your email before applying as a doctor.",
            });
        }

        const isApplyExists = await DoctorsApply.findOne({
            email: userEmail,
        })

        if (isApplyExists) {
            return res.status(409).json({
                success: false,
                message: "You have already applied.",
            });
        }

        const name = information.name.trim();

        if (!/^dr\.?\s/i.test(name)) {
            information.name = `Dr. ${name}`;
        } else {
            information.name = name.replace(/^dr\.?\s*/i, "Dr. ");
        }
        const doctorApplication = await DoctorsApply.create({
            ...information,
            userId: new ObjectId(userId),
            isApproved: false,
        });

        console.log(doctorApplication)

        res.status(201).json({
            success: true,
            message: "Doctor application submitted successfully",
            applicantId: doctorApplication._id.toString().slice(-8),
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to apply as doctor",
            error,
        });
    }
}