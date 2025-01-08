import mongoose, { Schema } from "mongoose";

const stockSchema: Schema = new Schema({
  symbol: { type: String, required: true },
  ltp: { type: Number, required: true }, // Last Traded Price
  volume: { type: Number, required: true },
  change: { type: Number, required: true },
  time: { type: Date, default: Date.now },
});

const newStock = mongoose.model("newStock", stockSchema);

export default newStock;
