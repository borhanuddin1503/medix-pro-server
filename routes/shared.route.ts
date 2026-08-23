import { Router } from "express";
import { verifyRole } from "../middlewares/verifyRole.ts";
import { getAppoinments, updateAppointment } from "../controllers/shared/shared.controller.ts";

const router = Router();


router.get('/appointments', verifyRole(['ADMIN', 'RECEPTIONIST']), getAppoinments);
router.patch('/appointments/status/:appointmentId', verifyRole(['ADMIN', 'RECEPTIONIST']), updateAppointment);


export default router;