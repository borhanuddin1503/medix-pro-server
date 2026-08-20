import { model, Schema } from "mongoose";
import type { IDoctorApply } from "../../lib/types/doctor.ts";

const doctorApplySchema = new Schema<IDoctorApply>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "user-datas",
        required: true,
    },

    specialization: {
        type: String,
        required: true,
    },

    degree: {
        type: [String],
        required: true,
    },

    experience: {
        type: String,
        required: true,
    },

    fees: {
        type: String,
        required: true,
    },

    chamber: {
        name: String,
        address: String,
        roomNo: String,
    },

    availableTime: String,
    availableDays: {
        type: [String],
        required: true
    },
    profileImage: String,

    bio: String,

    licenseNumber: {
        type: String,
        required: true,
        unique: true,
    },

    isApproved: {
        type: Boolean,
        default: false,
    },

    isActive: {
        type: Boolean,
        default: false,
    },

    name: String,
},
    {
        timestamps: true
    });


const DoctorsApply = model<IDoctorApply>("Doctorapplication", doctorApplySchema);
export default DoctorsApply;