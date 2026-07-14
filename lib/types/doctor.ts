import { Types } from "mongoose";

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