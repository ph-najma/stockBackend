import axios from "axios";
import Stock, { IStock } from "../models/stockModel";

export class fetchStockRepository {
  async fetchStockData(symbols: string[]): Promise<void> {
    try {
      for (const symbol of symbols) {
        // Fetch stock data from Alpha Vantage API
        const response = await axios.get("https://www.alphavantage.co/query", {
          params: {
            function: "GLOBAL_QUOTE",
            symbol,
            apikey: process.env.ALPHA_VANTAGE_API_KEY,
          },
        });

        const globalQuote = response.data["Global Quote"];
        if (!globalQuote) {
          console.error("Error fetching data:", response.data);
          return;
        }

        // Extract stock data from API response
        const fetchedVolume = parseInt(globalQuote["06. volume"]);

        // Check if the stock already exists in the database
        const existingStock = await Stock.findOne({ symbol });

        // If stock exists, update it, else create a new stock entry
        if (existingStock) {
          // Update the stock data and adjust the volume
          existingStock.timestamp = new Date();
          existingStock.latestTradingDay =
            globalQuote["07. latest trading day"];
          existingStock.price = parseFloat(globalQuote["05. price"]);
          existingStock.change = parseFloat(globalQuote["09. change"]);
          existingStock.changePercent = globalQuote["10. change percent"];
          existingStock.open = parseFloat(globalQuote["02. open"]);
          existingStock.high = parseFloat(globalQuote["03. high"]);
          existingStock.low = parseFloat(globalQuote["04. low"]);
          existingStock.close = parseFloat(globalQuote["08. previous close"]);
          existingStock.volume = fetchedVolume; // Market volume from API

          // Add fetched volume to adjusted volume (appending new volume data)
          existingStock.adjustedVolume = existingStock.adjustedVolume || 0;
          // Add the new volume

          await existingStock.save();
          console.log("Stock data updated:", existingStock);
        } else {
          // If stock doesn't exist, create a new stock entry
          const stock: IStock = new Stock({
            symbol: globalQuote["01. symbol"],
            timestamp: new Date(),
            latestTradingDay: globalQuote["07. latest trading day"],
            price: parseFloat(globalQuote["05. price"]),
            change: parseFloat(globalQuote["09. change"]),
            changePercent: globalQuote["10. change percent"],
            open: parseFloat(globalQuote["02. open"]),
            high: parseFloat(globalQuote["03. high"]),
            low: parseFloat(globalQuote["04. low"]),
            close: parseFloat(globalQuote["08. previous close"]),
            volume: fetchedVolume,
            adjustedVolume: fetchedVolume, // Initialize adjustedVolume with API volume
          });

          await stock.save();
          console.log("Stock data saved:", stock);
        }
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  }
}
