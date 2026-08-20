import type { Request, Response } from "express";

import DoctorsApply from "../../models/doctor/apply_doctor.model.ts";
import { Appointment } from "../../models/appoinments/appoinments.model.ts";
import type { AdminDashboardResponse } from "../../lib/types/admin.ts";


export const getAdminDashboard = async (
    req: Request,
    res: Response<AdminDashboardResponse>
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

        console.log('specialiazation data' , bySpecialization)

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