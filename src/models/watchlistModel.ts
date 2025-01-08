import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./userModel";
import { IStock } from "./stockModel";

// Define an interface for the Watchlist document
export interface IWatchlist extends Document {
  user: IUser["_id"]; // Reference to the User who owns the watchlist
  stocks: { symbol: string; addedAt: Date }[]; // Array of stocks being watched
  name: string; // Optional name for the watchlist
  createdAt: Date;
}

// Define the schema
const watchlistSchema = new Schema<IWatchlist>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  stocks: [
    {
      symbol: { type: String, required: true },
      addedAt: { type: Date, default: Date.now },
    },
  ],
  name: {
    type: String,
    default: "My Watchlist", // Default name for the watchlist
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create and export the model
const Watchlist = mongoose.model<IWatchlist>("Watchlist", watchlistSchema);

export default Watchlist;
