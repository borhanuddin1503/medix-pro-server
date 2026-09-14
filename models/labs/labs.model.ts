import mongoose, { Schema, Document, Model } from "mongoose";
import type { ILab } from "../../lib/types/labs.ts";


const labSchema = new Schema<ILab>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
        },

        address: {
            type: String,
            trim: true,
        },

        phone: {
            type: String,
            trim: true,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
        },

        images: {
            type: [String],
            default: [],
        },

        services: {
            type: [String],
            default: [],
        },

        openingTime: {
            type: String,
            trim: true,
        },

        closingTime: {
            type: String,
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

const Lab: Model<ILab> =
    mongoose.models.Lab || mongoose.model<ILab>("Lab", labSchema);

export default Lab;