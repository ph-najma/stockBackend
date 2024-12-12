// models/orderModel.ts
import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./userModel";
import { IStock } from "./stockModel";

export interface IOrder extends Document {
  user: IUser["_id"];
  stock: IStock["_id"];
  type: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "STOP";
  quantity: number;
  price: number;
  stopPrice?: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: Date;
  completedAt?: Date;
}

const orderSchema = new Schema<IOrder>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  stock: { type: Schema.Types.ObjectId, ref: "Stock", required: true },
  type: { type: String, enum: ["BUY", "SELL"], required: true },
  orderType: {
    type: String,
    enum: ["MARKET", "LIMIT", "STOP"],
    required: true,
  },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  stopPrice: { type: Number },
  status: {
    type: String,
    enum: ["PENDING", "COMPLETED", "FAILED"],
    default: "PENDING",
  },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

export default mongoose.model<IOrder>("Order", orderSchema);
