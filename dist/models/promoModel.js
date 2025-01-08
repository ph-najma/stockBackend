"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Define the schema
const promotionSchema = new mongoose_1.Schema({
    signupBonus: {
        enabled: { type: Boolean, required: true },
        amount: { type: Number, required: true },
        minimumDepositRequired: { type: Number, required: true },
        expiryDays: { type: Number, required: true },
    },
    referralBonus: {
        enabled: { type: Boolean, required: true },
        referrerAmount: { type: Number, required: true },
        refereeAmount: { type: Number, required: true },
        maxReferralsPerUser: { type: Number, required: true },
        minimumDepositRequired: { type: Number, required: true },
    },
    loyaltyRewards: {
        enabled: { type: Boolean, required: true },
        tradingAmount: { type: Number, required: true },
        rewardAmount: { type: Number, required: true },
        timeframeInDays: { type: Number, required: true },
    },
});
// Create and export the model
const Promotion = mongoose_1.default.model("Promotion", promotionSchema);
exports.default = Promotion;
