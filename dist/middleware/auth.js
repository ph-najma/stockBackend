"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTokenWithRole = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const userModel_1 = __importDefault(require("../models/userModel"));
dotenv_1.default.config();
// Assuming tokenBlacklist is defined elsewhere in your application
const tokenBlacklist = new Set();
// General Token Verification Middleware with Role Check
const verifyTokenWithRole = (requiredRole) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log("Middleware is running");
            const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
            console.log("Extracted token:", token);
            if (!token) {
                res
                    .status(401)
                    .json({ message: "Unauthorized access. Token missing." });
                return;
            }
            if (tokenBlacklist.has(token)) {
                console.log("Token is blacklisted:", token);
                res
                    .status(401)
                    .json({ message: "Unauthorized access. Token blacklisted." });
                return;
            }
            jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    console.error("JWT verification error:", err);
                    res.status(403).json({ message: "Failed to authenticate token." });
                    return;
                }
                const { userId, role: tokenRole } = decoded;
                const user = (yield userModel_1.default.findById(userId));
                if (!user) {
                    res.status(404).json({ message: "User not found." });
                    return;
                }
                if (user.is_Blocked) {
                    res.status(403).json({ message: "User is blocked. Logging out." });
                    return;
                }
                // Check role from database, not just the token
                if (user.role !== requiredRole) {
                    res.status(403).json({ message: "Insufficient permissions." });
                    return;
                }
                console.log("Token:", token);
                console.log("Decoded token:", decoded);
                console.log("User from DB:", user);
                req.userId = userId; // Attach userId to the request object
                req.role = user.role; // Attach role from the database to the request object
                next();
            }));
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error." });
        }
    });
};
exports.verifyTokenWithRole = verifyTokenWithRole;
