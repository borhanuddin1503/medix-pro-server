import { Router } from "express";
import { addLab, deleteLab, getAllLabs } from "../controllers/labs/labs.controller.ts";
import { verifyRole } from "../middlewares/verifyRole.ts";

const router = Router();

// add labs info 
router.post("/", verifyRole(["ADMIN"]), addLab);
router.get("/", getAllLabs);
router.delete("/:id", verifyRole(["ADMIN"]), deleteLab);

export default router