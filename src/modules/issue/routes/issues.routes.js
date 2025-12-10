import { Router } from "express";
import IssueController from "../controller/issue.controller.js";
import authenticationMiddlewares from "../../../middlewares/auth.middleware.js";

const router = Router();

const auth = authenticationMiddlewares.authentication;
const isCitizen = authenticationMiddlewares.authorization("citizen");

router.get("/", auth, IssueController.getIssues);
router.get("/:issueId", auth, IssueController.getSingleIssue);

// 2. Citizen Actions
router.post("/", auth, isCitizen, IssueController.createIssue);
router.put("/upvote/:issueId", auth, isCitizen, IssueController.upvoteIssue);

// Boost Issue
router.put("/boost/:issueId", auth, isCitizen, IssueController.boostIssue);

// Edit Own issue
router.put("/:issueId", auth, isCitizen, IssueController.editOwnIssue);

// Delete own issue
router.delete("/:issueId", auth, isCitizen, IssueController.deleteOwnIssue);

export default router;
