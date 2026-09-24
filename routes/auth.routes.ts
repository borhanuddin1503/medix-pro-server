import { Router } from "express";
import { ForgotPassword, LoginWithGoogle, refreshToken, registrationWithCredentials, resendVerificationCode, resetPassword, signIn, updateProfile, verifyEmail, whoMe } from "../controllers/auth/auth.controller.ts";
import { verifyRole } from "../middlewares/verifyRole.ts";


const router = Router();

router.get('/who-me', whoMe);
router.post('/google', LoginWithGoogle);
router.post('/refresh', refreshToken);
router.post('/register', registrationWithCredentials);
router.post('/sign-in', signIn);
router.post('/verify-email', verifyEmail);
router.post('/verify-email/resend', resendVerificationCode);
router.post("/forgot-password", ForgotPassword);
router.post("/reset-password", resetPassword);
router.patch("/profile", verifyRole(["USER", 'ADMIN', 'TECHNOLOGIST', 'RECEPTIONIST', 'DOCTOR']), updateProfile);



export default router