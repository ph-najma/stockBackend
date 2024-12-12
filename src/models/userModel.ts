import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { IStock } from "./stockModel";

// Define an interface for the User document
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string | undefined;
  email: string | undefined;
  password?: string | undefined; // Optional because it's not always required
  createdAt: Date;
  is_Blocked: boolean;
  is_Admin: boolean;
  googleId?: string;
  profilePhoto?: string;
  portfolio: { stockId: IStock["_id"]; quantity: number }[];
  comparePassword(password: string): Promise<boolean>;
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
      return !this.googleId; // Only require password if no Google ID is provided
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
  is_Admin: {
    type: Boolean,
    default: false,
  },
  googleId: {
    type: String, // Field for Google user ID
    unique: true,
    sparse: true, // Allows missing values to be unique
  },
  profilePhoto: {
    type: String, // Store the URL or path to the image
    default: "assets/default-profile.png", // Default profile image
  },
  portfolio: [
    {
      stockId: { type: Schema.Types.ObjectId, ref: "Stock" },
      quantity: { type: Number, required: true },
    },
  ],
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

// Create and export the model
const User = mongoose.model<IUser>("User", userSchema);
export default User;
