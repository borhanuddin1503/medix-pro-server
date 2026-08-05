import type { Request, Response } from "express";
import { stripe } from "../../utils/stripe.ts";
import DoctorsApply from "../../models/doctor/apply_doctor.model.ts";
import { ObjectId } from "mongodb";



export const createPaymentIntent = async (
    req: Request,
    res: Response
) => {
    try {
        const { doctorId } = req.body;
        const user = req.user;

        console.log('decoded user information', user);
        const doctorInfo = await DoctorsApply.findOne({ _id: new ObjectId(doctorId), isApproved: true });

        console.log('doctor information', doctorInfo);

        if (!doctorInfo) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }


        const paymentIntent =
            await stripe.paymentIntents.create({
                amount: Number(doctorInfo.fees) * 100, // Stripe uses smallest currency unit
                currency: "bdt",
                automatic_payment_methods: {
                    enabled: true,
                },
            });

        return res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to create payment intent",
        });
    }
};