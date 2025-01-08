import mongoose, { Schema, Document } from "mongoose";
import { IStock } from "./stockModel";

export interface Imetrics extends Document {
  stockId: IStock["_id"] | IStock;
  appVolume: number;
}

const stockMetricsSchema: Schema<Imetrics> = new Schema({
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stock",
    required: true,
  },
  appVolume: { type: Number, default: 0 },
});

const StockMetrics = mongoose.model<Imetrics>(
  "StockMetrics",
  stockMetricsSchema
);

export default StockMetrics;
