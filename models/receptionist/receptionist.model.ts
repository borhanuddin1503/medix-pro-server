import { Schema, model, Types } from "mongoose";

export interface IReceptionist {
    userId: Types.ObjectId;

    name: string;
    email: string;
    phone: string;

    profileImage?: string;

    employeeId?: string;

    isActive: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const receptionistSchema = new Schema<IReceptionist>(
    {
        // Better Auth User-এর ID
        userId: {
            type: Schema.Types.ObjectId,
            ref: "user-datas",
            required: true,
            unique: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        profileImage: {
            type: String,
            default: "",
        },

        employeeId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const Receptionist = model<IReceptionist>(
    "Receptionist",
    receptionistSchema
);

export default Receptionist;