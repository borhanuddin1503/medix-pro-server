import type { Request, Response } from "express";

import DoctorsApply from "../../models/doctor/apply_doctor.model.ts";
import { Appointment } from "../../models/appoinments/appoinments.model.ts";
import type { AdminDashboardResponse, DeleteDoctorRes, IAdminDashboardData, PatientsResponse, UpdateDoctorRes } from "../../lib/types/admin.ts";
import { Types } from "mongoose";
import { ObjectId } from "mongodb";


export const getAdminDashboard = async (
    req: Request,
    res: Response<AdminDashboardResponse<IAdminDashboardData>>
) => {
    try {
        const today = new Date()
            .toISOString()
            .split("T")[0];


        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const startOfTomorrow = new Date(startOfToday);
        startOfTomorrow.setDate(
            startOfTomorrow.getDate() + 1
        );

        const [
            totalDoctors,
            patientCountResult,
            todayAppointments,
            pendingAppointments,
            todayRevenue,
            totalRevenue,
            recentPayments,
            appointmentStats,
            pendingDoctors,
        ] = await Promise.all([
            // Total approved doctors
            DoctorsApply.countDocuments({
                isApproved: true,
            }),

            // Total unique patients
            Appointment.aggregate([
                {
                    $group: {
                        _id: "$patientId",
                    },
                },
                {
                    $count: "total",
                },
            ]),

            // Today's appointments
            Appointment.find({
                appointmentDate: today,
            })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),

            // Pending appointments
            Appointment.countDocuments({
                status: "PENDING",
            }),

            // Today's revenue
            Appointment.aggregate([
                {
                    $match: {
                        paid: true,
                        createdAt: {
                            $gte: startOfToday,
                            $lt: startOfTomorrow,
                        },
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$amount",
                        },
                    },
                },
            ]),

            // Total revenue
            Appointment.aggregate([
                {
                    $match: {
                        paid: true,
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$amount",
                        },
                    },
                },
            ]),

            // Recent payments
            Appointment.find({
                paid: true,
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),

            // Appointment statistics
            Appointment.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]),

            // Pending doctor applications
            DoctorsApply.find({
                isApproved: false,
            })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
        ]);


        console.log('today revineu', todayRevenue, 'total revinue', totalRevenue)

        const totalPatients =
            patientCountResult[0]?.total ?? 0;

        const todayRevenueAmount =
            todayRevenue[0]?.total ?? 0;

        const totalRevenueAmount =
            totalRevenue[0]?.total ?? 0;

        return res.status(200).json({
            success: true,

            message:
                "Admin dashboard data fetched successfully",

            data: {
                stats: {
                    totalDoctors,

                    totalPatients,

                    todayAppointments:
                        todayAppointments.length,

                    pendingAppointments,

                    todayRevenue:
                        todayRevenueAmount,

                    totalRevenue:
                        totalRevenueAmount,
                },

                todayAppointments,

                recentPayments,

                appointmentStats,

                pendingDoctors,
            },
        });
    } catch (error) {
        console.error(
            "Get admin dashboard error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to fetch admin dashboard data",

            data: {
                stats: {
                    totalDoctors: 0,
                    totalPatients: 0,
                    todayAppointments: 0,
                    pendingAppointments: 0,
                    todayRevenue: 0,
                    totalRevenue: 0,
                },

                todayAppointments: [],
                recentPayments: [],
                appointmentStats: [],
                pendingDoctors: [],
            },
        });
    }
};





type AnalyticsRange = "7d" | "30d" | "3m" | "6m" | "1y";

interface AppointmentAnalyticsResponse {
    success: boolean;
    message: string;
    data: {
        range: AnalyticsRange;
        summary: {
            total: number;
            completed: number;
            pending: number;
            cancelled: number;
        };
        trend: {
            date: string;
            total: number;
            completed: number;
            pending: number;
            cancelled: number;
        }[];
        bySpecialization: {
            specialization: string;
            count: number;
        }[];
    };
}



// admin analytistics
export const getAppointmentAnalytics = async (
    req: Request,
    res: Response<AppointmentAnalyticsResponse>
) => {
    try {
        const range = (req.query.range || "30d") as AnalyticsRange;

        const allowedRanges: AnalyticsRange[] = [
            "7d",
            "30d",
            "3m",
            "6m",
            "1y",
        ];

        if (!allowedRanges.includes(range)) {
            return res.status(400).json({
                success: false,
                message: "Invalid analytics range",
                data: {
                    range: "30d",
                    summary: {
                        total: 0,
                        completed: 0,
                        pending: 0,
                        cancelled: 0,
                    },
                    trend: [],
                    bySpecialization: [],
                },
            });
        }

        const now = new Date();

        const startDate = new Date(now);

        switch (range) {
            case "7d":
                startDate.setDate(now.getDate() - 6);
                break;

            case "30d":
                startDate.setDate(now.getDate() - 29);
                break;

            case "3m":
                startDate.setMonth(now.getMonth() - 2);
                startDate.setDate(1);
                break;

            case "6m":
                startDate.setMonth(now.getMonth() - 5);
                startDate.setDate(1);
                break;

            case "1y":
                startDate.setMonth(now.getMonth() - 11);
                startDate.setDate(1);
                break;
        }

        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        /**
         * Determine MongoDB grouping format.
         *
         * 7d / 30d  -> daily
         * 3m / 6m / 1y -> monthly
         */
        const groupFormat =
            range === "7d" || range === "30d"
                ? "%Y-%m-%d"
                : "%Y-%m";

        /**
         * Convert JS Date to YYYY-MM-DD
         * because appointmentDate is stored as string.
         */
        const startAppointmentDate =
            startDate.toISOString().split("T")[0];

        const endAppointmentDate =
            endDate.toISOString().split("T")[0];

        const [
            trend,
            summary,
            bySpecialization,
        ] = await Promise.all([
            // ------------------------------------
            // Appointment trend
            // ------------------------------------
            Appointment.aggregate([
                {
                    $match: {
                        appointmentDate: {
                            $gte: startAppointmentDate,
                            $lte: endAppointmentDate,
                        },
                    },
                },

                {
                    $group: {
                        _id: {
                            $substr: [
                                "$appointmentDate",
                                0,
                                groupFormat === "%Y-%m"
                                    ? 7
                                    : 10,
                            ],
                        },

                        total: {
                            $sum: 1,
                        },

                        completed: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$status",
                                            "COMPLETED",
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },

                        pending: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$status",
                                            "PENDING",
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },

                        cancelled: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$status",
                                            "CANCELLED",
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },

                {
                    $sort: {
                        _id: 1,
                    },
                },
            ]),

            // ------------------------------------
            // Appointment summary
            // ------------------------------------
            Appointment.aggregate([
                {
                    $match: {
                        appointmentDate: {
                            $gte: startAppointmentDate,
                            $lte: endAppointmentDate,
                        },
                    },
                },

                {
                    $group: {
                        _id: "$status",

                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]),

            // ------------------------------------
            // Appointments by specialization
            // ------------------------------------
            Appointment.aggregate([
                // 1. Date range
                {
                    $match: {
                        appointmentDate: {
                            $gte: startAppointmentDate,
                            $lte: endAppointmentDate,
                        },
                    },
                },

                // 2. Appointment থেকে Doctor খুঁজে বের করা
                {
                    $lookup: {
                        from: "doctorapplications",
                        foreignField: '_id',
                        localField: 'doctorId',
                        as: "doctor",
                    },
                },

                // 3. Array থেকে doctor object বের করা
                {
                    $unwind: "$doctor",
                },

                // 4. Specialization অনুযায়ী group
                {
                    $group: {
                        _id: "$doctor.specialization",

                        count: {
                            $sum: 1,
                        },
                    },
                },

                // 5. বেশি appointment আগে
                {
                    $sort: {
                        count: -1,
                    },
                },

                // 6. Top 10
                {
                    $limit: 10,
                },
            ])
        ]);

        // ----------------------------------------
        // Format summary
        // ----------------------------------------

        const summaryData = {
            total: 0,
            completed: 0,
            pending: 0,
            cancelled: 0,
        };

        for (const item of summary) {
            summaryData.total += item.count;

            if (item._id === "COMPLETED") {
                summaryData.completed = item.count;
            }

            if (item._id === "PENDING") {
                summaryData.pending = item.count;
            }

            if (item._id === "CANCELLED") {
                summaryData.cancelled = item.count;
            }
        }

        // ----------------------------------------
        // Format trend
        // ----------------------------------------

        const trendData = trend.map((item) => ({
            date: item._id,

            total: item.total,

            completed: item.completed,

            pending: item.pending,

            cancelled: item.cancelled,
        }));

        // ----------------------------------------
        // Format specialization
        // ----------------------------------------

        console.log('specialiazation data', bySpecialization)

        const specializationData =
            bySpecialization.map((item) => ({
                specialization:
                    item._id || "Unknown",

                count: item.count,
            }));

        return res.status(200).json({
            success: true,

            message:
                "Appointment analytics fetched successfully",

            data: {
                range,

                summary: summaryData,

                trend: trendData,

                bySpecialization:
                    specializationData,
            },
        });
    } catch (error) {
        console.error(
            "Get appointment analytics error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to fetch appointment analytics",

            data: {
                range: "30d",

                summary: {
                    total: 0,
                    completed: 0,
                    pending: 0,
                    cancelled: 0,
                },

                trend: [],

                bySpecialization: [],
            },
        });
    }
};




// doctors  apis for admin
export const updateDoctorsStatus = async (
    req: Request<{ id: string }>,
    res: Response<AdminDashboardResponse<UpdateDoctorRes>>
) => {
    try {

        const { id }: { id: string } = req.params;
        const { isApproved, isActive } = req.body;

        console.log('update route hits and id is', id);

        // =========================
        // Validate Doctor ID
        // =========================
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor id",
            });
        }

        // =========================
        // Validate Request Body
        // =========================
        if (
            typeof isApproved !== "boolean" &&
            typeof isActive !== "boolean"
        ) {
            return res.status(400).json({
                success: false,
                message: "No valid status provided",
            });
        }

        // =========================
        // Build Update
        // =========================
        const updateData: Partial<{
            isApproved: boolean;
            isActive: boolean;
        }> = {};

        if (typeof isApproved === "boolean") {
            updateData.isApproved = isApproved;
        }

        if (typeof isActive === "boolean") {
            updateData.isActive = isActive;
        }

        // =========================
        // Update Doctor
        // =========================
        const result = await DoctorsApply.updateOne(
            {
                _id: new ObjectId(id),
            },
            {
                $set: updateData,
            }
        );

        // =========================
        // Doctor Not Found
        // =========================
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        // =========================
        // Nothing Changed
        // =========================
        if (result.modifiedCount === 0) {
            return res.status(400).json({
                success: false,
                message: "Doctor status is already up to date",
            });
        }


        console.log('result', result)

        // =========================
        // Success
        // =========================
        return res.status(200).json({
            success: true,
            message: "Doctor status updated successfully",
            data: {
                ...result,
            },
        });

    } catch (error) {
        console.error(
            "Update doctor status error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update doctor status",
        });
    }
};



// delete doctor

export const deleteDoctor = async (
    req: Request<{ id: string }>,
    res: Response<AdminDashboardResponse<DeleteDoctorRes>>
) => {
    try {
        const { id } = req.params;

        // =========================
        // Validate Doctor ID
        // =========================
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor id",
            });
        }

        // =========================
        // Delete Doctor
        // =========================
        const result = await DoctorsApply.deleteOne({
            _id: new ObjectId(id),
        });

        // =========================
        // Doctor Not Found
        // =========================
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        // =========================
        // Success
        // =========================
        return res.status(200).json({
            success: true,
            message: "Doctor deleted successfully",
            data: {
                acknowledged: result.acknowledged,
                deletedCount: result.deletedCount,
            },
        });

    } catch (error) {
        console.error("Delete doctor error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete doctor",
        });
    }
};



// get patients
export const getAllPatients = async (
    req: Request,
    res: Response<AdminDashboardResponse<PatientsResponse>>
) => {
    try {
        const page = Math.max(
            Number(req.query.page) || 1,
            1
        );
        const limit = Math.min(Math.max(
            Number(req.query.limit) || 1,
            1
        ), 20);


        const skip = (page - 1) * limit;

        const search =
            (req.query.search as string)?.trim() || "";

        const matchStage: any = {};

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

        const patients = await Appointment.aggregate([
            // 1. Search
            {
                $match: matchStage,
            },

            // 2. Patient অনুযায়ী group
            {
                $group: {
                    _id: "$patientId",

                    name: {
                        $first: "$patientName",
                    },

                    email: {
                        $first: "$email",
                    },

                    phone: {
                        $first: "$phone",
                    },

                    totalAppointments: {
                        $sum: 1,
                    },

                    successfulAppointments: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        "COMPLETED",
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },

                    lastAppointmentDate: {
                        $max: "$appointmentDate",
                    },
                },
            },

            // 3. Pagination-এর আগে sort
            {
                $sort: {
                    lastAppointmentDate: -1,
                },
            },

            // 4. Pagination
            {
                $skip: skip,
            },

            {
                $limit: limit,
            },
        ]);

        // Total unique patients
        const totalResult =
            await Appointment.aggregate([
                {
                    $match: matchStage,
                },

                {
                    $group: {
                        _id: "$patientId",
                    },
                },

                {
                    $count: "total",
                },
            ]);

        const totalPatients =
            totalResult[0]?.total || 0;

        const totalPages = Math.ceil(
            totalPatients / limit
        );

        return res.status(200).json({
            success: true,
            message: "Patients fetched successfully",

            data: {
                patients,

                pagination: {
                    currentPage: page,
                    limit,
                    totalPatients,
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
            "Get all patients error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch patients",
        });
    }
};