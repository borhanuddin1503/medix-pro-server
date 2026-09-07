import mongoose, { Schema } from "mongoose";
import type { IDepartment } from "../../lib/types/departments.ts";

const departmentSchema = new Schema<IDepartment>({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        required: false,
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
});



export const Departments: mongoose.Model<IDepartment> = mongoose.model<IDepartment>("Departments", departmentSchema);