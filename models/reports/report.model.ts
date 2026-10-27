import mongoose, { Schema, Document } from "mongoose";
import type { IReport } from "../../lib/types/reports.ts";

const reportSchema = new Schema<IReport>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        image: {
            type: String,
            required: true,
        },

        doctorId: {
            type: Schema.Types.ObjectId,
            ref: "DoctorApplication",
            required: true,
        },

        
        appointmentId: {
            type: Schema.Types.ObjectId,
            ref: "Appointment",
            required: true,
        },

        reportType: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
        },

        result: {
            type: String,
            trim: true,
        },

        remarks: {
            type: String,
            trim: true,
        },

        status: {
            type: String,
            enum: ["PENDING", "COMPLETED", "CANCELLED"],
            default: "PENDING",
        },

        testDate: {
            type: Date,
            required: true,
        },

        reportDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const Report =
    mongoose.models.Report ||
    mongoose.model<IReport>("Report", reportSchema);

export default Report;