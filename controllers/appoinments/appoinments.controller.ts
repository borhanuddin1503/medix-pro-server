import DoctorsApply from "../../models/doctor/apply_doctor.model.ts";
import { Appointment } from "../../models/appoinments/appoinments.model.ts";
import type { Request, Response } from "express";
import { Types } from "mongoose";
import { stripe } from "../../utils/stripe.ts";
import { ObjectId } from "mongodb";



// book appoinment
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
            email,
            paymentMethod,
            paymentIntentId,
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
                message: "Doctor and date are required",
            });
        }



        // Find doctor
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



        // Check doctor availability

        const selectedDate = new Date(date);


        const dayName = selectedDate.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
            }
        );



        const isAvailable = doctor.availableDays.some(
            (day) => day.toLowerCase() === dayName.toLowerCase()
        );



        if (!isAvailable) {
            return res.status(400).json({
                success: false,
                message: "Doctor is not available on this day",
            });
        }




        // Prevent duplicate booking

        const alreadyBooked =
            await Appointment.findOne({
                doctorId,
                appointmentDate: date,
                patientId: new Types.ObjectId(patientId),
            });



        if (alreadyBooked) {
            return res.status(409).json({
                success: false,
                message: "This appointment is already booked",
            });
        }




        // Payment verification

        let paid = false;
        let amount: number | undefined;
        let currency: string | undefined;



        if (paymentMethod === "ONLINE") {


            if (!paymentIntentId) {
                return res.status(400).json({
                    success: false,
                    message: "Payment information missing",
                });
            }



            const paymentIntent =
                await stripe.paymentIntents.retrieve(
                    paymentIntentId
                );




            if (paymentIntent.status !== "succeeded") {
                return res.status(400).json({
                    success: false,
                    message: "Payment not completed",
                });
            }



            paid = true;

            amount = paymentIntent.amount / 100;

            currency = paymentIntent.currency;
        }



        // Create appointment

        const appointment =
            await Appointment.create({

                doctorId,

                patientId,

                patientName,

                phone,

                email,

                appointmentDate: date,

                reason,

                status: "PENDING",


                paymentMethod,

                paid,

                paymentIntentId:
                    paymentIntentId || null,

                amount,

                currency,

            });



        return res.status(201).json({

            success: true,

            message: "Appointment booked successfully",

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

            message: "Failed to book appointment",

        });
    }
};




// get appoinments
export const getMyAppointments = async (
    req: Request,
    res: Response
) => {
    try {
        const patientId = req.user?._id;
        const { page = 1, limit = 5 } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        if (!patientId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
            });
        }




        // appoinments
        const [appointments, totalAppointments] = await Promise.all([
            Appointment.find({
                patientId: new Types.ObjectId(patientId),
            })
                .populate({
                    path: "doctorId",
                    select:
                        "name profileImage specialization fees availableTime availableDays",
                })
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(Number(limit)),

            Appointment.countDocuments({
                patientId: new Types.ObjectId(patientId),
            }),
        ]);


        return res.status(200).json({
            success: true,
            message: "Appointments fetched successfully",
            data: appointments,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: totalAppointments,
                totalPages: Math.ceil(totalAppointments / Number(limit)),
                hasNextPage: Number(page) < Math.ceil(totalAppointments / Number(limit)),
                hasPrevPage: Number(page) > 1,
            },
        });
    } catch (error) {
        console.error("Get appointments error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch appointments",
        });
    }
};