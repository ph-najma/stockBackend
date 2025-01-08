import express, { Router } from "express";
import newStock from "../models/newStock";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const router: Router = express.Router();

router.get("/angelStocks/:symbol", async (req, res) => {
  const { symbol } = req.params;
  console.log("heloo");
  try {
    // Call Angel One API
    const response = await axios.get(
      `https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/getLTPData`,
      {
        headers: {
          Authorization: `Bearer ${process.env.ANGEL_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-KEY": process.env.ANGEL_API_KEY,
        },
        params: {
          exchange: "NSE", // or "BSE"
          tradingsymbol: symbol,
        },
      }
    );
    console.log(response);
    console.log("API Response:", response.data);
    console.log("this is data", response.data.data);

    const stockData = response.data.data;

    if (stockData && stockData.tradingsymbol) {
      const stock = new newStock({
        symbol: stockData.tradingsymbol,
        ltp: stockData.ltp,
        volume: stockData.volume,
        change: stockData.change,
      });

      await stock.save();

      res.status(200).json({
        message: "Stock data fetched and saved successfully",
        data: stock,
      });
    } else {
      res.status(400).json({
        message: "Invalid data format received from the API",
      });
    }
  } catch (error: any) {
    console.error("Error fetching stock data:", error.message);
    res
      .status(500)
      .json({ message: "Error fetching stock data", error: error.message });
  }
});
router.get("/getData", async (req, res) => {
  const stocks = await newStock.find();
  res.status(200).json(stocks);
});
export default router;
