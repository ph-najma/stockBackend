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
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const userModel_1 = __importDefault(require("../models/userModel"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Correct the strategy options and callback types
const googleStrategyOptions = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback",
};
passport_1.default.use(new passport_google_oauth20_1.Strategy(googleStrategyOptions, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        // Check if emails exist on profile and ensure it's safely accessed
        const email = profile.emails && ((_a = profile.emails[0]) === null || _a === void 0 ? void 0 : _a.value);
        if (!email) {
            return done(new Error("Email not found in Google profile"));
        }
        // Find or create a user with the Google profile info
        const user = (yield userModel_1.default.findOne({
            googleId: profile.id,
        }));
        if (!user) {
            // Create a new user if not found
            const newUser = new userModel_1.default({
                googleId: profile.id,
                name: profile.displayName,
                email,
                profilePicture: (_c = (_b = profile.photos) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.value, // Safe access for photos
            });
            yield newUser.save();
            return done(null, newUser);
        }
        return done(null, user);
    }
    catch (err) {
        console.error(err);
        return done(err);
    }
})));
passport_1.default.serializeUser(((user, done) => {
    done(null, user._id);
}));
// Deserialize the user from the session
passport_1.default.deserializeUser((id, done) => {
    userModel_1.default.findById(id, (err, user) => {
        done(err, user);
    });
});
exports.default = passport_1.default;
