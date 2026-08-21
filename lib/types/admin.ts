import type { Types } from "mongoose";
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


export interface Patient {
    _id: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    totalAppointments: number;
    successfulAppointments: number;
    lastAppointmentDate: string;
}


export interface Pagination {
    currentPage: number;
    limit: number;
    totalPatients: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}


export interface PatientsResponse {
    patients: Patient[];
    pagination: Pagination;
}



