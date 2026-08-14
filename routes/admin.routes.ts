
import { Router } from "express";
import { verifyRole } from "../middlewares/verifyRole.ts";
import { getAdminDashboard, getAppointmentAnalytics } from "../controllers/admin/admin.controller.ts";

const router = Router();

router.get(
    "/admin/dashboard",
    verifyRole(["ADMIN"]),
    getAdminDashboard
);

router.get(
    "/admin/dashboard/appointment-analytics",
    verifyRole(["ADMIN"]),
    getAppointmentAnalytics
);

export default router;