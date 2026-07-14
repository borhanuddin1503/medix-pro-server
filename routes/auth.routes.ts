import { Router } from "express";
import { whoMe } from "../controllers/auth/auth.controller.ts";

const router = Router();

router.get('/who-me' , whoMe)


export default router