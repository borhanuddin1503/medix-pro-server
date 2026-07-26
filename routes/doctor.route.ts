import { Router } from "express";
import { applyDoctor } from "../controllers/doctor/doctor.controller.ts";
import { verifyRole } from "../middlewares/verifyRole.ts";

const router = Router();

router.post(
    "/apply",
    verifyRole(['USER', 'PATIENT']),
    applyDoctor
);


export default router;