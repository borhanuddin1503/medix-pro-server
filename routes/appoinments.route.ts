import { Router } from "express";
import { bookAppointment } from "../controllers/appoinments/appoinments.controller.ts";
import { verifyRole } from "../middlewares/verifyRole.ts";

const router = Router();

router.post('/', verifyRole(['USER' ,'ADMIN']), bookAppointment);



export default router