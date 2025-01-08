import { time, timeStamp } from "console";
import Stock, { IStock } from "../models/stockModel";
import { Model } from "mongoose";
import mongoose from "mongoose";
export interface IStockRepository {
  getAllStocks(): Promise<IStock[]>;
  createStock(stockData: Partial<IStock>): Promise<IStock>;
  getStockById(
    id: string | mongoose.Types.ObjectId | undefined
  ): Promise<IStock | null>;
  updateStock(id: string, updatedData: Partial<IStock>): Promise<IStock | null>;
  deleteStock(id: string): Promise<void>;
  getMarketPrice(id: string): Promise<any>;
  getStockData(symbol: string | undefined): Promise<IStock[]>;
}
export class StockRepository implements IStockRepository {
  private model: Model<IStock>;
  constructor() {
    this.model = Stock;
  }
  async getAllStocks() {
    const stocks = await Stock.aggregate([
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: "$symbol",
          originalId: { $first: "$_id" },
          symbol: { $first: "$symbol" },
          timestamp: { $first: "$timestamp" },
          open: { $first: "$open" },
          high: { $first: "$high" },
          low: { $first: "$low" },
          close: { $first: "$close" },
          volume: { $first: "$adjustedVolume" },
          price: { $first: "$price" },
          change: { $first: "$change" },
          changePercent: { $first: "$changePercent" },
          latestTradingDay: { $first: "$latestTradingDay" },
        },
      },
      {
        $project: {
          _id: 0,
          originalId: 1,
          symbol: 1,
          timestamp: 1,
          open: 1,
          high: 1,
          low: 1,
          close: 1,
          volume: 1,
          price: 1,
          change: 1,
          changePercent: 1,
          latestTradingDay: 1,
        },
      },
    ]);

    return stocks;
  }

  // Create a new stock
  async createStock(stockData: Partial<IStock>): Promise<IStock> {
    return await this.model.create(stockData);
  }
  // Fetch a single stock by ID
  async getStockById(
    id: string | mongoose.Types.ObjectId | undefined
  ): Promise<IStock | null> {
    console.log("hello from repos");
    const stock = await this.model.findById(id);
    console.log(stock);
    return stock;
  }
  // Update a stock by ID
  async updateStock(
    id: string,
    updatedData: Partial<IStock>
  ): Promise<IStock | null> {
    return await this.model.findByIdAndUpdate(id, updatedData, { new: true });
  }

  // Delete a stock by ID
  async deleteStock(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }
  async getMarketPrice(symbol: string): Promise<any> {
    const stockData = await this.model
      .findOne({ symbol })
      .select({ timeStamp: -1 })
      .exec();
    return stockData ? stockData.price : null;
  }
  async getStockData(symbol: string | undefined): Promise<IStock[]> {
    const stockData = await this.model.find({ symbol }).sort({ timestamp: 1 });
    console.log(stockData);
    return stockData;
  }
}
