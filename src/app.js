import express from "express";
import cors from "cors";



const app = express();


const allowedOrigin = [
    "http://localhost:5173"
]

app.use(cors({
    origin: allowedOrigin,
    credentials: true
}));

app.use(express.json());


app.use(/.*/, cors({
    origin: allowedOrigin,
    credentials: true
}))

app.get("/", (req, res) => {
    return res.status(200).json({
        message:"health ok"
    })
})


// Auth Route
import AuthRoute from "./modules/auth/routes/auth.routes.js";
app.use("/api/v1/auth", AuthRoute);


// User Route
import UserRoute from "./modules/user/user.routes.js";
app.use("/api/v1/users", UserRoute);


// Issue Route
import IssueRoute from "./modules/issue/routes/issues.routes.js";
app.use("/api/v1/issues", IssueRoute);


// Admin Route
import AdminRoute from "./modules/admin/route/admin.routes.js";
app.use("/api/v1/admin", AdminRoute);


// Staff Route
import StaffRoute from "./modules/staff/route/staff.routes.js";
app.use("/api/v1/staf", StaffRoute);


// Payment Route
import PaymentRoute from "./modules/payment/routes/payment.routes.js";
app.use("/api/v1/payment", PaymentRoute);


export default app;