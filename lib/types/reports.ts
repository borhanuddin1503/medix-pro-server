import type mongoose from "mongoose";

export interface IReport {
    _id?: mongoose.Types.ObjectId;

    name: string;
    image: string;

    doctorId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    labId: mongoose.Types.ObjectId;

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