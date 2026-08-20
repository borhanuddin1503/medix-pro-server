import { Router } from "express";
import { applyDoctor, getDoctors } from "../controllers/doctor/doctor.controller.ts";
import { verifyRole } from "../middlewares/verifyRole.ts";

const router = Router();

router.post(
    "/apply",
    verifyRole(['USER', 'PATIENT', 'ADMIN']),
    applyDoctor
);

router.get('/', getDoctors);
router.get('/admin', verifyRole(['ADMIN']), getDoctors);

export default router;