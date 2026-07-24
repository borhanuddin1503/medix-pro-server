import { Router } from "express";
import { ForgotPassword, LoginWithGoogle, refreshToken, registrationWithCredentials, resendVerificationCode, resetPassword, signIn, verifyEmail, whoMe } from "../controllers/auth/auth.controller.ts";


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



export default router