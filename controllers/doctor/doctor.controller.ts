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





// get doctor by search or single doctor
export async function getDoctors(req: Request, res: Response) {
    try {
        const {
            doctorId,
            search,
            specialization,
            page = "1",
            limit = "10",
        } = req.query;


        // =========================
        // Single Doctor
        // =========================

        if (doctorId) {
            const doctor = await DoctorsApply.findOne({
                _id: new ObjectId(doctorId.toString()),
                isApproved: true,
            }).populate(
                "userId",
                "email"
            );


            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: "Doctor not found",
                });
            }


            return res.status(200).json({
                success: true,
                data: doctor,
            });
        }


        // =========================
        // Search Doctors
        // =========================

        const currentPage = Number(page);
        const itemsPerPage = Number(limit);

        const skip = (currentPage - 1) * itemsPerPage;


        const filter: any = {
            isApproved: true,
        };


        // Search by name / specialization
        if (search) {

            filter.$or = [
                {
                    specialization: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    bio: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    name: {
                        $regex: search,
                        $option: "i",
                    }
                }
            ];
        }


        // Filter by specialization
        if (specialization) {

            filter.specialization = {
                $regex: specialization,
                $options: "i",
            };
        }


        const [doctors, totalDoctors] = await Promise.all([
            DoctorsApply.find(filter)
                .populate(
                    "userId",
                    " email "
                )
                .skip(skip)
                .limit(itemsPerPage)
                .sort({
                    createdAt: -1,
                }),

            DoctorsApply.countDocuments(filter),

        ]);


        return res.status(200).json({

            success: true,

            data: doctors,

            pagination: {
                currentPage,
                itemsPerPage,
                totalDoctors,
                totalPages: Math.ceil(
                    totalDoctors / itemsPerPage
                ),
            },

        });


    } catch (error) {

        console.error("Get doctors error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch doctors",
        });
    }
}