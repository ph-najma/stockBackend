import User, { IUser } from "../models/userModel";
import { Model } from "mongoose";
import mongoose from "mongoose";
import { use } from "passport";

export interface IuserRepsitory {
  findByEmail(email: String): Promise<IUser | null>;
  findByOtp(otp: string): Promise<IUser | null>;
  findById(
    userId: string | mongoose.Types.ObjectId | undefined
  ): Promise<IUser | null>;
  save(userData: Partial<IUser>): Promise<IUser>;
  updateById(userId: string, updateData: Partial<IUser>): Promise<IUser | null>;
  updatePassword(email: string, newPassword: string): Promise<void>;
  findOrCreateGoogleUser(
    googleId: string,
    userData: Partial<IUser>
  ): Promise<IUser>;
  findAdminByEmail(email: string): Promise<IUser | null>;
  findAllUsers(): Promise<IUser[]>;
  saveUser(user: IUser): Promise<IUser>;
  getUserById(id: string | undefined): Promise<IUser | null>;
  updatePortfolio(
    userId: string,
    portfolioData: { stockId: string; quantity: number }
  ): Promise<IUser | null>;
  getUserBalance(userId: string): Promise<number | null>;
  updateUserBalance(userId: string, amount: number): Promise<IUser | null>;
  updatePortfolioAfterSell(
    userId: string,
    stockId: string,
    quantityToSell: number
  ): Promise<IUser | null>;
  addSignupBonus(
    userId: string,
    promotionId: string,
    bonusAmount: number
  ): Promise<IUser | null>;
  findByRefferalCode(refferalcode: string): Promise<IUser | null>;
  getPromotions(userId: string | undefined): Promise<IUser | null>;
}
export class UserRepository implements IuserRepsitory {
  private model: Model<IUser>;
  constructor() {
    this.model = User;
  }
  // Find user by email
  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  // Find user by OTP
  async findByOtp(otp: string): Promise<IUser | null> {
    return User.findOne({ otp });
  }
  //Find by ID

  async findById(
    userId: string | mongoose.Types.ObjectId | undefined
  ): Promise<IUser | null> {
    return await User.findById(userId).populate({
      path: "portfolio.stockId", // This is the path to the referenced model
      model: "Stock", // Ensure you specify the model name for Stock
    });
  }

  // Save a new user
  async save(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return user.save();
  }

  // Update user data
  async updateById(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, updateData, { new: true });
  }

  // Update user password
  async updatePassword(email: string, newPassword: string): Promise<void> {
    const user = await User.findOne({ email });
    if (user) {
      user.password = newPassword;
      await user.save();
    }
  }
  // Find or create Google user
  async findOrCreateGoogleUser(
    googleId: string,
    userData: Partial<IUser>
  ): Promise<IUser> {
    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User(userData);
      await user.save();
    }
    return user;
  }
  //Find an admin by email

  async findAdminByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email, is_Admin: true });
  }

  //Find all users

  async findAllUsers(): Promise<IUser[]> {
    return User.find({ is_Admin: false });
  }

  //Save a user
  async saveUser(user: IUser): Promise<IUser> {
    return user.save();
  }
  // Fetch user by ID
  async getUserById(id: string | undefined): Promise<IUser | null> {
    const user = await this.model
      .findById(id)
      .populate({
        path: "portfolio.stockId", // This is the path to the referenced model
        model: "Stock", // Ensure you specify the model name for Stock
      })
      .exec();
    console.log(user, "from repo");
    return user;
  }
  async updatePortfolio(
    userId: string,
    portfolioData: { stockId: string; quantity: number }
  ): Promise<IUser | null> {
    return await this.model.findByIdAndUpdate(
      userId,
      { $push: { portfolio: portfolioData } },
      { new: true }
    );
  }
  // Fetch user balance
  async getUserBalance(userId: string): Promise<number | null> {
    const user = await this.model.findById(userId);
    return user?.balance || null;
  }
  // Update user balance
  async updateUserBalance(
    userId: string | undefined,
    amount: number
  ): Promise<IUser | null> {
    return await this.model.findByIdAndUpdate(
      userId,
      { $inc: { balance: amount } },
      { new: true }
    );
  }
  async addSignupBonus(
    userId: string,
    promotionId: string,
    bonusAmount: number
  ): Promise<IUser | null> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.balance += bonusAmount;
    user.promotions.push(new mongoose.Types.ObjectId(promotionId));
    await user.save();

    return user;
  }
  async updatePortfolioAfterSell(
    userId: string,
    stockId: string,
    quantityToSell: number
  ): Promise<IUser | null> {
    const user = await this.model.findById(userId);

    if (!user) throw new Error("User not found");

    // Check if the stock exists in the portfolio
    const stockIdObject = new mongoose.Types.ObjectId(stockId);
    const stockIndex = user.portfolio.findIndex(
      (item) => item.stockId.toString() === stockIdObject.toString()
    );

    if (stockIndex === -1) {
      throw new Error("Stock not found in portfolio");
    }

    const stockInPortfolio = user.portfolio[stockIndex];

    if (stockInPortfolio.quantity < quantityToSell) {
      throw new Error("Not enough stock to sell");
    }

    if (stockInPortfolio.quantity === quantityToSell) {
      user.portfolio.splice(stockIndex, 1);
    } else {
      stockInPortfolio.quantity -= quantityToSell;
    }

    return await user.save();
  }
  async findByRefferalCode(refferalcode: string): Promise<IUser | null> {
    return await User.findOne({ referralCode: refferalcode });
  }
  async getPromotions(userId: string | undefined): Promise<IUser | null> {
    const user = await User.findById(userId).populate("promotions").exec();
    return user;
  }
}
