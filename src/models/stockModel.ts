import mongoose, { Schema, Document, ObjectId } from "mongoose";
import { Types } from "mongoose";
export interface IStock extends Document {
  _id: Types.ObjectId;
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  price: number;
  change: number;
  changePercent: string;
  latestTradingDay: string;
  adjustedVolume: number;
}

const stockSchema: Schema = new Schema({
  symbol: { type: String, required: true },
  timestamp: { type: Date, required: true },
  open: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  close: { type: Number, required: true },
  volume: { type: Number, required: true },
  price: { type: Number, required: true },
  change: { type: Number, required: true },
  changePercent: { type: String, required: true },
  latestTradingDay: { type: String, required: true },
  adjustedVolume: { type: Number, required: true },
});

const Stock = mongoose.model<IStock>("Stock", stockSchema);

export default Stock;
