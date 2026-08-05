import { Router } from "express";
import { verifyRole } from "../middlewares/verifyRole.ts";
import { createPaymentIntent } from "../controllers/payments/payment.controller.ts";

const router = Router();

router.post(
    "/create-payment-intent",
    verifyRole(["USER", "ADMIN", "DOCTOR", "TECHNOLOGIST", "RECEPTIONIST", "PATIENT"]),
    createPaymentIntent
);


export default router;