import express from "express";
import { generateFormLink, submitStudentForm } from "../controllers/form.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { formSubmissionRateLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/generate-form-link", protect, generateFormLink);
router.post("/submit-form/:token", formSubmissionRateLimiter, submitStudentForm);

export default router;
