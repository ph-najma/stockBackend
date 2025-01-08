import mongoose, { Schema, Document } from "mongoose";

// Define interfaces for each type of promotion
export interface ISignupBonus {
  enabled: boolean;
  amount: number;
  minimumDepositRequired: number;
  expiryDays: number;
}

export interface IReferralBonus {
  enabled: boolean;
  referrerAmount: number;
  refereeAmount: number;
  maxReferralsPerUser: number;
  minimumDepositRequired: number;
}

export interface ILoyaltyRewards {
  enabled: boolean;
  tradingAmount: number;
  rewardAmount: number;
  timeframeInDays: number;
}

// Define the Promotion schema interface
export interface IPromotion extends Document {
  signupBonus: ISignupBonus;
  referralBonus: IReferralBonus;
  loyaltyRewards: ILoyaltyRewards;
}

// Define the schema
const promotionSchema = new Schema<IPromotion>({
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
const Promotion = mongoose.model<IPromotion>("Promotion", promotionSchema);
export default Promotion;
