import { Router } from "express";
import authenticationMiddlewares from "../../../middlewares/auth.middleware.js";
import PaymentController from "../controller/payment.controller.js";

const router = Router();

// --- Define Middleware Shortcuts ---
const auth = authenticationMiddlewares.authentication;
const isCitizen = authenticationMiddlewares.authorization("citizen");
const isAdmin = authenticationMiddlewares.authorization("admin");

// ===========================================
// 1. CITIZEN/PAYMENT ACTIONS
// ===========================================

// POST /payments/transaction: Simulates/records a successful payment (Subscription or Boost)
// Requires authentication and is primarily a Citizen action (since they are the ones paying)
router.post(
    "/transaction", 
    auth, 
    isCitizen, 
    PaymentController.recordSuccessfulTransaction
);

// GET /payments/history: Fetches the authenticated user's payment history
router.get(
    "/history", 
    auth, 
    PaymentController.getPaymentHistory
);

// GET /payments/invoice/:paymentId: Fetches data for generating a specific invoice PDF
// Accessible by the transaction owner OR an Admin
router.get(
    "/invoice/:paymentId", 
    auth, 
    PaymentController.getInvoice
);


// ===========================================
// 2. ADMIN REPORTING ACTIONS
// ===========================================

// GET /payments/admin/report: Fetches the overall payment report for Admin review
router.get(
    "/admin/report", 
    auth, 
    isAdmin, 
    PaymentController.getAdminReport
);


export default router;