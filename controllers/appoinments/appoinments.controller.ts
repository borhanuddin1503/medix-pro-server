import DoctorsApply from "../../models/doctor/apply_doctor.model.ts";
import { Appointment } from "../../models/appoinments/appoinments.model.ts";
import type { Request, Response } from "express";
import { Types } from "mongoose";
import { stripe } from "../../utils/stripe.ts";




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

        console.log('selected date', selectedDate);

        const dayName = selectedDate.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
            }
        );

        console.log('dayName', dayName);


        const isAvailable =
            doctor.availableDays.includes(dayName);



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


                console.log('payment intent' , paymentIntent);


            if (paymentIntent.status !== "succeeded") {
                return res.status(400).json({
                    success: false,
                    message: "Payment not completed",
                });
            }



            paid = true;

            amount = paymentIntent.amount;

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