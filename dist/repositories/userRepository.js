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
exports.UserRepository = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
class UserRepository {
    // Find user by email
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield userModel_1.default.findOne({ email });
        });
    }
    // Find user by OTP
    findByOtp(otp) {
        return __awaiter(this, void 0, void 0, function* () {
            return userModel_1.default.findOne({ otp });
        });
    }
    //Find by ID
    findById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield userModel_1.default.findById(userId);
        });
    }
    // Save a new user
    save(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = new userModel_1.default(userData);
            return user.save();
        });
    }
    // Update user data
    updateById(userId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            return userModel_1.default.findByIdAndUpdate(userId, updateData, { new: true });
        });
    }
    // Update user password
    updatePassword(email, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield userModel_1.default.findOne({ email });
            if (user) {
                user.password = newPassword;
                yield user.save();
            }
        });
    }
    // Find or create Google user
    findOrCreateGoogleUser(googleId, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield userModel_1.default.findOne({ googleId });
            if (!user) {
                user = new userModel_1.default(userData);
                yield user.save();
            }
            return user;
        });
    }
    //Find an admin by email
    findAdminByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return userModel_1.default.findOne({ email, is_Admin: true });
        });
    }
    //Find all users
    findAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return userModel_1.default.find({ is_Admin: false });
        });
    }
    //Save a user
    saveUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            return user.save();
        });
    }
}
exports.UserRepository = UserRepository;
