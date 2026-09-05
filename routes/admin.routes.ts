
import { Router } from "express";
import { verifyRole } from "../middlewares/verifyRole.ts";
import { deleteDoctor, getAdminDashboard, getAllPatients, getAllUsers, getAppointmentAnalytics, updateDoctorsStatus, updateUserRole } from "../controllers/admin/admin.controller.ts";

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

router.get(
    "/users",
    verifyRole(["ADMIN"]),
    getAllUsers
);


router.patch(
    "/users/:id/role",
    verifyRole(["ADMIN"]),
    updateUserRole
);

export default router;