import transactionModel, { ITransaction } from "../models/transactionModel";

export interface ITransactionRepository {
  getTransactions(userId: string | undefined): Promise<ITransaction[]>;
  getAllTransactions(): Promise<ITransaction[]>;
  getFeeCollectionSummary(): Promise<number>;
}
export class transactionRepository {
  async getTransactions(userId: string | undefined): Promise<ITransaction[]> {
    const transactions = await transactionModel
      .find({
        $or: [{ buyer: userId }, { seller: userId }],
      })
      .populate("buyer")
      .populate("seller")
      .populate("buyOrder")
      .populate("sellOrder")
      .populate("stock");

    console.log("Fetched transactions:", transactions);
    return transactions;
  }
  async getAllTransactions(): Promise<ITransaction[]> {
    const transactions = await transactionModel
      .find()
      .populate("buyer", "name")
      .populate("seller", "name")
      .populate("stock", "symbol")
      .exec();
    console.log(transactions, "from here");
    return transactions;
  }
  async getFeeCollectionSummary(): Promise<number> {
    try {
      const totalFees = await transactionModel.aggregate([
        {
          $match: {
            status: "COMPLETED",
          },
        },
        {
          $group: {
            _id: null,
            totalFees: { $sum: "$fees" },
          },
        },
      ]);
      console.log(totalFees);

      return totalFees[0]?.totalFees || 0;
    } catch (error) {
      console.error("Error fetching fee collection summary: ", error);
      throw error;
    }
  }
}
