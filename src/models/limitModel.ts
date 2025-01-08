import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILimit extends Document {
  maxBuyLimit: number;
  maxSellLimit: number;
  timeframeInHours: number;
}

const LimitSchema: Schema = new Schema<ILimit>({
  maxBuyLimit: {
    type: Number,
    required: true,
    default: 1000,
  },
  maxSellLimit: {
    type: Number,
    required: true,
    default: 500,
  },
  timeframeInHours: {
    type: Number,
    required: true,
    default: 24,
  },
});

const Limit: Model<ILimit> = mongoose.model<ILimit>("Limit", LimitSchema);
export default Limit;
