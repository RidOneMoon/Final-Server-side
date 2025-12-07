import dotenv from "dotenv";
import path from "path";


dotenv.config({
    path: path.join(process.cwd(), ".env")
});


const config = {
    port: process.env.PORT,
    mongodb_uri:process.env.MONGODB_URI,
    jwt_secret: process.env.JWT_SECRET,
    db_name: "infrastructure-issues-system"
}

export default config;