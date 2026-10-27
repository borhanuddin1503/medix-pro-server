import { Router } from "express";
import { createReport, getReports } from "../controllers/reports/reports.controller.ts";
import { verifyRole } from "../middlewares/verifyRole.ts";

const router = Router();

router.post('/', verifyRole(['TECHNOLOGIST']), createReport);
router.get('/', verifyRole(['TECHNOLOGIST', 'ADMIN']), getReports);




export default router