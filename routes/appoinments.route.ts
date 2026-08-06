import { Router } from "express";
import { bookAppointment, getMyAppointments } from "../controllers/appoinments/appoinments.controller.ts";
import { verifyRole } from "../middlewares/verifyRole.ts";

const router = Router();

router.post('/', verifyRole(['USER' ,'ADMIN' , 'DOCTOR' , 'RECEPTIONIST' , 'TECHNOLOGIST']), bookAppointment);
router.get('/my-appointments', verifyRole(['USER' ,'ADMIN' , 'DOCTOR' , 'RECEPTIONIST' , 'TECHNOLOGIST']), getMyAppointments);



export default router