import jwt from "jsonwebtoken";
import config from "../config/index.js";

const jwtSign = (jwtPayload) => {
  return jwt.sign(
    jwtPayload,
    config.jwt_secret,
    { expiresIn: "4d" }
  );
};

export default jwtSign;
