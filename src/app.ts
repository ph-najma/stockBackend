import express, { Application, Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db";
import userRoute from "./routes/userRoutes";
import adminRoute from "./routes/adminRoutes";
import session from "express-session";
import passport from "passport";
import axios from "axios";
import cron from "node-cron";
import Stock, { IStock } from "./models/stockModel";
import transactionModel from "./models/transactionModel";
import Order from "./models/orderModel";
import User from "./models/userModel";
import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config();
// Create the express app
const app: Application = express();

// Connect to the database
connectDB();

// Middleware for session management
app.use(
  session({
    secret: "my-secret-key", // Secret key for signing the session
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Enable CORS
app.use(cors({ origin: "http://localhost:4200" }));

// Middleware to parse JSON
app.use(express.json());

// Use morgan middleware for logging HTTP requests
if (process.env.NODE_ENV === "development") {
  // Logs detailed information (e.g., method, url, response time)
  app.use(morgan("dev")); // You can use other formats like 'tiny' or 'combined'
} else {
  // In production, use a more concise format and log to a file
  const fs = require("fs");
  const path = require("path");

  // Create a write stream (in append mode)
  const logStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
    flags: "a",
  });

  // Log requests to the access.log file
  app.use(morgan("combined", { stream: logStream }));
}

// Routes
app.use(userRoute);
app.use(adminRoute);

cron.schedule("* * * * *", async () => {
  console.log("Running order matching...");
  try {
    await matchOrders(); // Call your order matching function
    console.log("Order matching completed.");
  } catch (error) {
    console.error("Error while matching orders:", error);
  }
});
cron.schedule("* * * * *", () => {
  console.log("Fetching stock data...");
  fetchStockData("AAPL"); // Replace 'AAPL' with your desired stock symbol
});

export const fetchStockData = async (symbol: string): Promise<void> => {
  try {
    const response = await axios.get("https://www.alphavantage.co/query", {
      params: {
        function: "GLOBAL_QUOTE",
        symbol,
        interval: "1min",
        apikey: process.env.ALPHA_VANTAGE_API_KEY,
      },
    });

    const globalQuote = response.data["Global Quote"];
    if (!globalQuote) {
      console.error("Error fetching data:", response.data);
      return;
    }

    // Create a new stock record
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
      volume: parseInt(globalQuote["06. volume"]),
    });

    await stock.save();
    console.log("Stock data saved:", stock);
  } catch (error) {
    console.error("Error fetching stock data:", error);
  }
};

export const matchOrders = async () => {
  try {
    const marketOrders = await Order.find({ status: "PENDING" });

    for (const order of marketOrders) {
      const { orderType, type, price, quantity, stock } = order;
      const oppositeSide = type === "BUY" ? "SELL" : "BUY";

      const stockDoc = await Stock.findById(stock);

      if (!stockDoc) {
        console.error(`Stock with ID ${stock} not found`);
        continue;
      }

      let bestOrder = await Order.findOne({
        stock,
        type: oppositeSide,
        status: "PENDING",
        ...(orderType === "LIMIT"
          ? { price: type === "BUY" ? { $lte: price } : { $gte: price } }
          : {}),
      }).sort(
        orderType === "MARKET"
          ? { price: type === "BUY" ? -1 : 1 }
          : { createdAt: 1 }
      );

      if (bestOrder) {
        const matchPrice = bestOrder.price;
        const matchedQuantity = Math.min(quantity, bestOrder.quantity);

        // Update orders
        order.quantity -= matchedQuantity;
        bestOrder.quantity -= matchedQuantity;
        if (order.quantity === 0) order.status = "COMPLETED";
        if (bestOrder.quantity === 0) bestOrder.status = "COMPLETED";

        await order.save();
        await bestOrder.save();

        // Update stock price
        stockDoc.price = matchPrice;
        await stockDoc.save();

        // Create transaction
        const fees = 0.01 * matchPrice * matchedQuantity;
        const transaction = await transactionModel.create([
          {
            buyer: type === "BUY" ? order.user : bestOrder.user,
            seller: type === "SELL" ? order.user : bestOrder.user,
            buyOrder: type === "BUY" ? order._id : bestOrder._id,
            sellOrder: type === "SELL" ? order._id : bestOrder._id,
            stock: stockDoc._id,
            type,
            quantity: matchedQuantity,
            price: matchPrice,
            totalAmount: matchPrice * matchedQuantity,
            fees,
            status: "COMPLETED",
            createdAt: new Date(),
            completedAt: new Date(),
          },
        ]);

        // Update the user portfolio after the transaction
        const buyer = await User.findById(transaction[0].buyer);
        const seller = await User.findById(transaction[0].seller);

        if (buyer) {
          // Update buyer's portfolio
          const existingStock = buyer.portfolio.find(
            (portfolioItem) => portfolioItem.stockId === stockDoc._id
          );

          if (type === "BUY") {
            // Add stock to buyer's portfolio
            if (existingStock) {
              existingStock.quantity += matchedQuantity;
            } else {
              buyer.portfolio.push({
                stockId: stockDoc._id,
                quantity: matchedQuantity,
              });
            }
          } else if (type === "SELL") {
            // Remove stock from buyer's portfolio (if they had it)
            if (existingStock) {
              existingStock.quantity -= matchedQuantity;
              if (existingStock.quantity === 0) {
                buyer.portfolio = buyer.portfolio.filter(
                  (item) => item.stockId !== stockDoc._id
                );
              }
            }
          }

          await buyer.save();
        }

        if (seller) {
          // Update seller's portfolio (reverse the transaction)
          const existingStock = seller.portfolio.find(
            (portfolioItem) => portfolioItem.stockId === stockDoc._id
          );

          if (type === "SELL") {
            // Add stock to seller's portfolio
            if (existingStock) {
              existingStock.quantity += matchedQuantity;
            } else {
              seller.portfolio.push({
                stockId: stockDoc._id,
                quantity: matchedQuantity,
              });
            }
          } else if (type === "BUY") {
            // Remove stock from seller's portfolio (if they had it)
            if (existingStock) {
              existingStock.quantity -= matchedQuantity;
              if (existingStock.quantity === 0) {
                seller.portfolio = seller.portfolio.filter(
                  (item) => item.stockId !== stockDoc._id
                );
              }
            }
          }

          await seller.save();
        }
      }
    }

    console.log("Order matching completed successfully");
  } catch (error) {
    console.error("Error matching orders:", error);
  }
};
// Test route
app.get("/", (req: Request, res: Response) => {
  res.send("API is running..");
});

export default app;
