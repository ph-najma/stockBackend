import mongoose from "mongoose";
import Watchlist, { IWatchlist } from "../models/watchlistModel";

export interface IWatchlistRepository {
  getByUserId(userId: string | undefined): Promise<IWatchlist | null>;
  ensureWatchlistAndAddStock(
    userId: string | undefined,
    stockId: string
  ): Promise<IWatchlist>;
}
export class watchlistRepostory {
  async getByUserId(userId: string | undefined): Promise<IWatchlist | null> {
    const raw = await Watchlist.findOne({ user: userId });
    console.log(raw);
    const watchlist = await Watchlist.findOne({ user: userId }).populate({
      path: "stocks.symbol",
      select: "symbol  price change volume",
    });

    console.log("from wathclist", watchlist);
    return watchlist;
  }
  async ensureWatchlistAndAddStock(
    userId: string | undefined,
    stockSymbol: string
  ): Promise<IWatchlist> {
    if (!userId) {
      throw new Error("User ID is required.");
    }

    // Find the user's watchlist
    let watchlist = await Watchlist.findOne({ user: userId });

    if (watchlist) {
      // Check if the stock is already in the watchlist
      const stockExists = watchlist.stocks.some(
        (stock) => stock.symbol === stockSymbol
      );

      // If the stock is not in the watchlist, add it
      if (!stockExists) {
        watchlist.stocks.push({ symbol: stockSymbol, addedAt: new Date() });
        await watchlist.save();
      }
    } else {
      // If no watchlist exists, create a new one with the stock
      watchlist = new Watchlist({
        user: userId,
        stocks: [{ symbol: stockSymbol, addedAt: new Date() }],
      });
      await watchlist.save();
    }

    console.log("Updated watchlist:", watchlist);
    return watchlist;
  }
}
