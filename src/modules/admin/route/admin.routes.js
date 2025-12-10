import { Router } from "express";
import authenticationMiddlewares from "../../../middlewares/auth.middleware.js";
import AdminController from "../controller/admin.controller.js";
import UserController from "../../user/user.controller.js";


const router = Router();

const auth = authenticationMiddlewares.authentication;
const isAdmin = authenticationMiddlewares.authorization("admin");


router.get("/users", auth, isAdmin, UserController.getUsers); 
router.put("/user/:userId", auth, isAdmin, UserController.updateUserByAdmin);

router.post("/staff", auth, isAdmin, UserController.addStaff);


router.put("/assign/:issueId", auth, isAdmin, AdminController.assignStaff);
router.put("/reject/:issueId", auth, isAdmin, AdminController.rejectIssue);

export default router;