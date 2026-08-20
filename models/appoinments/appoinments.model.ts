import mongoose, { Model, Schema } from "mongoose";
import type { IAppointment } from "../../lib/types/doctor.ts";

const appointmentSchema = new Schema<IAppointment>(
    {
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: "Doctorapplication",
            required: true,
        },


        patientId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        patientName: {
            type: String,
            required: true,
        },

        phone: {
            type: String,
            required: true,
        },


        email: {
            type: String,
            required: true,
        },


        appointmentDate: {
            type: String,
            required: true,
        },

        reason: {
            type: String,
            trim: true,
        },


        status: {
            type: String,
            enum: [
                "PENDING",
                "CONFIRMED",
                "COMPLETED",
                "CANCELLED",
            ],
            default: "PENDING",
        },
        paymentMethod: {
            type: String,
            enum: ["ONLINE", "CASH"],
            default: "CASH",
            required: true,
        },

        paid: {
            type: Boolean,
            default: false,
        },
        paymentIntentId: {
            type: String,
        },
        amount: {
            type: Number,
        },
        currency: {
            type: String,
        }
    },
    {
        timestamps: true,
    },

);



// prevent duplicate booking
appointmentSchema.index(
    {
        doctorId: 1,
        appointmentDate: 1,
        appointmentTime: 1,
    },
    {
        unique: true,
    }
);



export const Appointment: Model<IAppointment> =
    mongoose.model<IAppointment>(
        "Appointment",
        appointmentSchema
    );