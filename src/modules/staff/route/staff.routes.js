import { Router } from "express";
import StaffController from "../controller/satff.controller.js";
import authenticationMiddlewares from "../../../middlewares/auth.middleware.js"

const router = Router();

const auth = authenticationMiddlewares.authentication;
const isStaff = authenticationMiddlewares.authorization("staff");
const isStaffOrAdmin = authenticationMiddlewares.authorization("staff", "admin");




router.put("/status/:issueId", auth, isStaffOrAdmin, StaffController.updateIssueStatus);
router.post("/progress/:issueId", auth, isStaff, StaffController.addProgressUpdate);
export default router;