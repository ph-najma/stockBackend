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
exports.verifyAdminToken = exports.verifyUserToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const userModel_1 = __importDefault(require("../models/userModel"));
dotenv_1.default.config();
// Assuming tokenBlacklist is defined elsewhere in your application
const tokenBlacklist = new Set();
// Middleware to verify JWT token for users
const verifyUserToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
        if (!token || tokenBlacklist.has(token)) {
            res.status(401).json({ message: "Unauthorized access." });
            return;
        }
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                res.status(403).json({ message: "Failed to authenticate token." });
                return;
            }
            const { userId } = decoded;
            const user = (yield userModel_1.default.findById(userId));
            if (!user) {
                res.status(404).json({ message: "User not found." });
                return;
            }
            if (user.is_Blocked) {
                res.status(403).json({ message: "User is blocked. Logging out." });
                return;
            }
            req.userId = userId; // Attach userId to the request object
            next();
        }));
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
});
exports.verifyUserToken = verifyUserToken;
// Middleware to verify JWT token for admins
const verifyAdminToken = (req, res, next) => {
    try {
        const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
        if (!token) {
            res.status(401).json({ message: "No token provided." });
            return;
        }
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                res.status(403).json({ message: "Failed to authenticate token." });
                return;
            }
            const { userId } = decoded;
            req.userId = userId; // Attach userId to the request object
            console.log("Admin authenticated successfully. User ID:", req.userId);
            next();
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};
exports.verifyAdminToken = verifyAdminToken;
