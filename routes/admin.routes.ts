
import { Router } from "express";
import { verifyRole } from "../middlewares/verifyRole.ts";
import { deleteDoctor, getAdminDashboard, getAllPatients, getAppointmentAnalytics, updateDoctorsStatus } from "../controllers/admin/admin.controller.ts";

const router = Router();

router.get(
    "/dashboard",
    verifyRole(["ADMIN"]),
    getAdminDashboard
);

router.get(
    "/dashboard/appointment-analytics",
    verifyRole(["ADMIN"]),
    getAppointmentAnalytics
);

router.patch(
    "/doctors/:id/status",
    verifyRole(["ADMIN"]),
    updateDoctorsStatus
);

router.delete(
    "/doctors/:id",
    verifyRole(["ADMIN"]),
    deleteDoctor
);

router.get(
    "/patients",
    verifyRole(["ADMIN"]),
    getAllPatients
);

export default router;