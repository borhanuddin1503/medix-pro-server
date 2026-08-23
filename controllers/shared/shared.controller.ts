import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Appointment } from "../../models/appoinments/appoinments.model.ts";
import type { IResponse, SharedAppointmentsResponse } from "../../lib/types/shared.ts";
import type { IAppointment } from "../../lib/types/doctor.ts";


export const getAppoinments = async (
    req: Request,
    res: Response<IResponse<SharedAppointmentsResponse>>
) => {
    try {
        const page = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const limit = Math.min(
            Math.max(
                Number(req.query.limit) || 10,
                1
            ),
            100
        );

        const skip = (page - 1) * limit;

        const search =
            (req.query.search as string)?.trim() || "";

        const doctorId =
            (req.query.doctorId as string)?.trim() || "";

        const matchStage: Record<string, any> = {};

        // Search
        if (search) {
            matchStage.$or = [
                {
                    patientName: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    phone: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ];
        }

        // Doctor filter
        if (doctorId) {
            matchStage.doctorId =
                new mongoose.Types.ObjectId(
                    doctorId
                );
        }

        const [appointments, totalAppointments] =
            await Promise.all([
                Appointment.aggregate([
                    // 1. Search + doctor filter
                    {
                        $match: matchStage,
                    },

                    // 2. Latest appointments first
                    {
                        $sort: {
                            appointmentDate: -1,
                            createdAt: -1,
                        },
                    },

                    // 3. Pagination
                    {
                        $skip: skip,
                    },

                    {
                        $limit: limit,
                    },

                    // 4. Doctor information
                    {
                        $lookup: {
                            from: "doctorapplications",
                            localField: "doctorId",
                            foreignField: "_id",
                            as: "doctor",
                        },
                    },

                    // 5. Doctor array থেকে object
                    {
                        $unwind: {
                            path: "$doctor",
                            preserveNullAndEmptyArrays: true,
                        },
                    },

                    // 6. Required fields
                    {
                        $project: {
                            _id: 1,

                            doctorId: 1,

                            patientId: 1,
                            patientName: 1,
                            phone: 1,
                            email: 1,

                            appointmentDate: 1,
                            reason: 1,

                            status: 1,

                            paymentMethod: 1,
                            paid: 1,

                            paymentIntentId: 1,
                            amount: 1,
                            currency: 1,

                            createdAt: 1,

                            doctorName: {
                                $ifNull: [
                                    "$doctor.name",
                                    "Unknown Doctor",
                                ],
                            },
                            profile: '$doctor.profileImage'
                        },
                    },
                ]),

                Appointment.countDocuments(
                    matchStage
                ),
            ]);

        const totalPages = Math.ceil(
            totalAppointments / limit
        );

        return res.status(200).json({
            success: true,
            message:
                "Appointments fetched successfully",

            data: {
                appointments,

                pagination: {
                    currentPage: page,
                    limit,

                    totalAppointments,
                    totalPages,

                    hasNextPage:
                        page < totalPages,

                    hasPreviousPage:
                        page > 1,
                },
            },
        });
    } catch (error) {
        console.error(
            "Get admin appointments error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch appointments",
        });
    }
};




// state change route
export const updateAppointment = async (
    req: Request<{ appointmentId: string }>,
    res: Response
) => {
    try {
        const { appointmentId } = req.params;

        const { status, paid } = req.body;

        // At least one field must be provided
        if (
            status === undefined &&
            paid === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Either status or paid is required",
            });
        }

       

        const updateData: {
            status?: IAppointment["status"];
            paid?: boolean;
        } = {};

        // =========================
        // Status update
        // =========================
        if (status !== undefined) {
            const allowedStatuses = [
                "PENDING",
                "CONFIRMED",
                "COMPLETED",
                "CANCELLED",
            ];

            if (
                !allowedStatuses.includes(status)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid appointment status",
                });
            }

            updateData.status = status;
        }

        // =========================
        // Paid update
        // =========================
        if (paid !== undefined) {
            if (typeof paid !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Paid must be a boolean",
                });
            }

            updateData.paid = paid;
        }

        // =========================
        // Update appointment
        // =========================
        const appointment =
            await Appointment.findByIdAndUpdate(
                appointmentId,
                {
                    $set: updateData,
                },
                {
                    new: true,
                    runValidators: true,
                }
            );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message:
                    "Appointment not found",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Appointment updated successfully",
            data: appointment,
        });
    } catch (error) {
        console.error(
            "Update appointment error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update appointment",
        });
    }
};