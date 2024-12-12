import Stock, { IStock } from "../models/stockModel";

export class StockRepository {
  async getAllStocks() {
    return await Stock.find();
  }
}
