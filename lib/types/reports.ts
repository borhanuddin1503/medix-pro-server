import type mongoose from "mongoose";

export interface IReport {
    _id?: mongoose.Types.ObjectId;

    name: string;
    image: string;

    doctorId: mongoose.Types.ObjectId;

    reportType: string;
    appointmentId?: mongoose.Types.ObjectId;
    description?: string;

    status: "PENDING" | "COMPLETED" | "CANCELLED";

    testDate: Date;
    reportDate?: Date;
    technologistId: mongoose.Types.ObjectId;

    result?: string;
    remarks?: string;

    createdAt?: Date;
    updatedAt?: Date;
}


export interface ICreateReportResponse {
    success: boolean;
    message: string;
    data?: {
        _id: string;
        name: string;
        image: string;
        doctorId: string;
        patientId: string;
        labId: string;
        appointmentId: string;
        reportType: string;
        description?: string;
        result?: string;
        remarks?: string;
        status: "PENDING" | "COMPLETED" | "CANCELLED";
        testDate: string;
        reportDate?: string;
        technologistId: string;
        createdAt: string;
        updatedAt: string;
    };
}

export interface IGetReportsResponse {
    success: boolean;
    message: string;
    data?: {
        reports: IReport[];
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}