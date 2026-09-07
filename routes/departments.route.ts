import { Router } from "express";
import { createDepartment, getAllDepartments } from "../controllers/departments/departments.controller.ts";
import { verifyRole } from "../middlewares/verifyRole.ts";

const router = Router();

// Define your department routes here
router.get("/", getAllDepartments);
router.post("/", verifyRole(['ADMIN']), createDepartment);


export default router;