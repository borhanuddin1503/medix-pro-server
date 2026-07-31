
import DoctorsApply from "../../models/doctor/apply_doctor.model.ts";
import { Appointment } from "../../models/appoinments/appoinments.model.ts";
import type { Request, Response } from "express";
import { Types } from "mongoose";


export const bookAppointment = async (
    req: Request,
    res: Response
) => {

    try {

        const {
            doctorId,
            date,
            reason,
            patientName,
            phone,
            email
        } = req.body;


        const patientId = req.user?._id;


        if (!patientId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
            });
        }


        if (!doctorId || !date) {
            return res.status(400).json({
                success: false,
                message:
                    "Doctor, date and time are required",
            });
        }



        // Check doctor
        const doctor = await DoctorsApply.findOne({
            _id: doctorId,
            isApproved: true,
        });


        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }



        // Check available day

        const selectedDate = new Date(date);

        const dayName = selectedDate.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
            }
        );


        const isAvailable =
            doctor.availableDays.includes(dayName);



        if (!isAvailable) {
            return res.status(400).json({
                success: false,
                message:
                    "Doctor is not available on this day",
            });
        }



        // Check duplicate booking

        const alreadyBooked =
            await Appointment.findOne({
                doctorId,
                appointmentDate: date,
                patientId: new Types.ObjectId(patientId)
            });



        if (alreadyBooked) {
            return res.status(409).json({
                success: false,
                message:
                    "This slot is already booked",
            });
        }



        // Create appointment

        const appointment =
            await Appointment.create({

                doctorId,

                patientId,

                patientName,

                phone,

                appointmentDate: date,

                reason,

                email,

                status: "PENDING",

                paymentStatus: "UNPAID",
            });



        return res.status(201).json({

            success: true,

            message:
                "Appointment booked successfully",

            data: {

                bookingId:
                    appointment._id.toString().slice(-6),

                date:
                    appointment.appointmentDate,
            },

        });



    } catch (error) {

        console.error(
            "Book appointment error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to book appointment",

        });
    }
};