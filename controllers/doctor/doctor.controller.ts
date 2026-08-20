import type { Request, Response } from "express";
import DoctorsApply from "../../models/doctor/apply_doctor.model.ts";
import { ObjectId } from "mongodb";
import { Types, type PipelineStage } from "mongoose";

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

export const getDoctors = async (req: Request, res: Response) => {
    try {
        const {
            doctorId,
            search,
            specialization,
            page = "1",
            limit = "8",
        } = req.query;



        console.log('doctorId from server' , doctorId)

        const currentPage = Math.max(1, Number(page) || 1);
        const itemsPerPage = Math.max(1, Number(limit) || 8);
        const skip = (currentPage - 1) * itemsPerPage;

        // =========================
        // Match Stage
        // =========================
        const match: any = {};

        console.log(req.user?.email);

        if (req.user?.role !== "ADMIN") {
            match.isApproved = true;
        }

        if (doctorId) {
            if (!Types.ObjectId.isValid(doctorId.toString())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid doctor id",
                });
            }

            match._id = new Types.ObjectId(doctorId.toString());
        }

        if (specialization) {
            match.specialization = {
                $regex: specialization.toString(),
                $options: "i",
            };
        }

        if (search) {
            match.$or = [
                {
                    name: {
                        $regex: search.toString(),
                        $options: "i",
                    },
                },
                {
                    specialization: {
                        $regex: search.toString(),
                        $options: "i",
                    },
                },
                {
                    bio: {
                        $regex: search.toString(),
                        $options: "i",
                    },
                },
            ];
        }

        // =========================
        // Aggregation Pipeline
        // =========================
        const pipeline: PipelineStage[] = [
            {
                $match: match,
            },
            {
                $lookup: {
                    from: "user-datas",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,

                    name: 1,
                    email: "$user.email",
                    profileImage: 1,

                    specialization: 1,
                    experience: 1,
                    fees: 1,
                    isApproved: 1 ,

                    availableDays: 1,
                    availableTime: 1,

                    chamber: 1,
                    bio: 1,
                    degree: 1,
                    licenseNumber: 1,

                    createdAt: 1,
                    isActive: 1,
                },
            },
        ];

        // Single doctor হলে pagination লাগবে না
        if (!doctorId) {
            pipeline.push(
                {
                    $sort: {
                        createdAt: 1,
                    },
                },
                {
                    $skip: skip,
                },
                {
                    $limit: itemsPerPage,
                }
            );
        }

        const [doctors, totalDoctors] = await Promise.all([
            DoctorsApply.aggregate(pipeline),
            DoctorsApply.countDocuments(match),
        ]);

        // =========================
        // Single Doctor Response
        // =========================
        if (doctorId) {
            if (!doctors.length) {
                return res.status(404).json({
                    success: false,
                    message: "Doctor not found",
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    doctors,
                },
            });
        }

        // =========================
        // All Doctors Response
        // =========================
        const totalPages = Math.ceil(totalDoctors / itemsPerPage);

        return res.status(200).json({
            success: true,
            message: "Successfully fetched doctors",
            data: {
                doctors,
                total: totalDoctors,
                page: currentPage,
                limit: itemsPerPage,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1,
            },
        });
    } catch (error) {
        console.error("Get doctors error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch doctors",
            error: error instanceof Error ? error.message : error,
        });
    }
};

