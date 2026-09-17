import { Router } from "express";
import { createDepartment, deleteDepartment, getAllDepartments, updateDepartment } from "../controllers/departments/departments.controller.ts";
import { verifyRole } from "../middlewares/verifyRole.ts";

const router = Router();

// Define your department routes here
router.get("/", getAllDepartments);
router.post("/", verifyRole(['ADMIN', 'RECEPTIONIST']), createDepartment);
router.patch("/:_id", verifyRole(['ADMIN', 'RECEPTIONIST']), updateDepartment);
router.delete("/:_id", verifyRole(['ADMIN', 'RECEPTIONIST']), deleteDepartment);


export default router;