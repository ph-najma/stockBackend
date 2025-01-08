import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { IStock } from "./stockModel";
import { IPromotion } from "./promoModel";

// Define an interface for the User document
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string | undefined;
  email: string | undefined;
  password?: string | undefined;
  createdAt: Date;
  is_Blocked: boolean;
  role: "user" | "admin";
  is_Admin: boolean;
  googleId?: string;
  profilePhoto?: string;
  portfolio: { stockId: IStock["_id"]; quantity: number }[];
  comparePassword(password: string): Promise<boolean>;
  balance: number;
  referralCode?: string;
  referredBy?: string;
  referralsCount: number;
  promotions: mongoose.Types.ObjectId[];
  checkLoyaltyRewards(): Promise<void>;
}

// Define the schema
const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function (this: IUser) {
      return !this.googleId;
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  is_Blocked: {
    type: Boolean,
    required: true,
    default: false,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  is_Admin: {
    type: Boolean,
    default: false,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  profilePhoto: {
    type: String,
    default: "assets/default-profile.png",
  },
  portfolio: [
    {
      stockId: { type: Schema.Types.ObjectId, ref: "Stock" },
      quantity: { type: Number, required: true },
    },
  ],
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  promotions: [
    {
      type: Schema.Types.ObjectId,
      ref: "Promotion", // Reference the Promotion model
    },
  ],
  referralCode: { type: String, unique: true },
  referredBy: { type: String },
  referralsCount: { type: Number, default: 0 },
});

// Pre-save hook to hash the password
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password as string);
};
// Method to check for loyalty rewards based on promotions
userSchema.methods.checkLoyaltyRewards = async function (): Promise<void> {
  const user = this;

  for (const promotionId of user.promotions) {
    const promotion = await mongoose
      .model<IPromotion>("Promotion")
      .findById(promotionId);

    if (promotion && promotion.loyaltyRewards.enabled) {
      if (user.balance >= promotion.loyaltyRewards.tradingAmount) {
        user.balance += promotion.loyaltyRewards.rewardAmount;
        console.log("Loyalty rewards applied:", user.balance);
      }
    }
  }
  await user.save();
};

// Create and export the model
const User = mongoose.model<IUser>("User", userSchema);
export default User;
