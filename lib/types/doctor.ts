import mongoose, { Types } from "mongoose";

export interface IDoctorApply {
    userId: Types.ObjectId;
    specialization: string;
    degree: string[];
    experience: string;
    fees: string;

    chamber: {
        name: string;
        address: string;
        roomNo?: string;
    };

    availableTime: string;
    availableDays: [string];

    profileImage?: string;
    bio?: string;
    licenseNumber: string;
    isApproved: boolean;

    createdAt?: Date;
    updatedAt?: Date;
    name: string;
}



export interface IAppointment extends Document {

    doctorId: mongoose.Types.ObjectId;

    patientId: mongoose.Types.ObjectId;

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


    paymentStatus:
    | "UNPAID"
    | "PAID"
    | "REFUNDED";


    createdAt: Date;
    updatedAt: Date;
}