import type { IAppointment } from "./doctor.ts";

export interface IAppointmentStats {
    _id:
    | "PENDING"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED";

    count: number;
}

export interface IRevenue {
    _id: null;
    total: number;
}

export interface IAdminDashboardStats {
    totalDoctors: number;
    totalPatients: number;
    todayAppointments: number;
    pendingAppointments: number;
    todayRevenue: number;
    totalRevenue: number;
}

export interface IAdminDashboardData {
    stats: IAdminDashboardStats;

    todayAppointments: IAppointment[];

    recentPayments: IAppointment[];

    appointmentStats: IAppointmentStats[]

    pendingDoctors: unknown[];
}

export interface AdminDashboardResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}
export interface UpdateDoctorRes {
    acknowledged: boolean,
    matchedCount: number,
    modifiedCount: number

}
export interface DeleteDoctorRes {
    acknowledged: boolean;
    deletedCount: number;

}



