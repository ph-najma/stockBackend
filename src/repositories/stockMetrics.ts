import StockMetrics, { Imetrics } from "../models/stockMetrics";

export interface IstockMetricsRepository {
  updateStockMetrics(stockId: string, quantity: number): Promise<Imetrics>;
}

export class stockMetricsRepository implements IstockMetricsRepository {
  async updateStockMetrics(
    stockId: string,
    quantity: number
  ): Promise<Imetrics> {
    const updatedData = await StockMetrics.findOneAndUpdate(
      { stockId },
      { $inc: { appVolume: quantity } },
      { upsert: true, new: true }
    ).populate("stockId");

    if (!updatedData) {
      throw new Error(`StockMetrics with stockId: ${stockId} not found.`);
    }

    return updatedData as Imetrics;
  }
}
