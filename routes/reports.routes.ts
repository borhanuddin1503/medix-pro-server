import { Router } from "express";
import { createReport } from "../controllers/reports/reports.controller.ts";
import { verifyRole } from "../middlewares/verifyRole.ts";

const router = Router();

router.get('/reports', verifyRole(['TECHNOLOGIST']), createReport)




export default router