import { Types } from "mongoose";


export interface IResponse<T> {
    success: boolean;
    message: string;
    data?: T
}


export interface SharedAppointment {
    _id: Types.ObjectId;

    doctorId: Types.ObjectId;

    patientId: Types.ObjectId;
    patientName: string;
    phone: string;
    email: string;

    appointmentDate: string;
    reason?: string;

    status:
    | "PENDING"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED";

    paymentMethod: "ONLINE" | "CASH";
    paid: boolean;

    paymentIntentId?: string | null;
    amount?: number;
    currency?: string;

    createdAt: Date;

    doctorName: string;
    profile: string;
}


export interface AppointmentPagination {
    currentPage: number;
    limit: number;
    totalAppointments: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}


export interface SharedAppointmentsResponse {
    appointments: SharedAppointment[];
    pagination: AppointmentPagination;
}

