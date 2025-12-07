import jwt from "jsonwebtoken";
import config from "../config/index.js";

const authentication = async (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization;

    if (!bearerToken || !bearerToken.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Token not found or malformed",
      });
    }

    const token = bearerToken.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token missing or invalid",
      });
    }

    const decoded = jwt.verify(token, config.jwt_secret);

    if (!decoded) {
      return res.status(401).json({
        message: "Unauthenticate: Invalid token or expired",
      });
    }

    const payload = {
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthenticated: Invalid or expired token",
    });
  }
};

const authorization = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userRole = req?.user?.role;

      if (!userRole) {
        return res.status(403).json({
          message: "Forbidden: No role found",
        });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: "Forbidden: You are not allowed",
        });
      }

      next();
    } catch (error) {
      return res.status(403).json({
        message: "Forbidden: You are not allowed",
      });
    }
  };
};

const authenticationMiddlewares = {
  authentication,
  authorization,
};

export default authenticationMiddlewares;
