import { Router } from "express";
import { addLab, deleteLab, getAllLabs, updateLab } from "../controllers/labs/labs.controller.ts";
import { verifyRole } from "../middlewares/verifyRole.ts";

const router = Router();

// labs routes
router.post("/", verifyRole(["ADMIN"]), addLab);
router.get("/", getAllLabs);
router.delete("/:id", verifyRole(["ADMIN"]), deleteLab);
router.patch("/:id", verifyRole(["ADMIN"]), updateLab);

export default router