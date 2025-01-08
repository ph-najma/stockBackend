import express, { Application, Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db";
import userRoute from "./routes/userRoutes";
import adminRoute from "./routes/adminRoutes";
import stockRoute from "./routes/stockRoute";
import session from "express-session";
import passport from "passport";
import cron from "node-cron";
import { autoSquareOff } from "./services/squareOffService";
import { newOrderRepository } from "./repositories/newOrder";
import { fetchStockRepository } from "./repositories/fetchStock";
import morgan from "morgan";
import { createStream } from "rotating-file-stream"; // Log rotation
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { io } from "./server";
import http from "http";

dotenv.config();

// Create the express app
const app: Application = express();
const PORT = 8080;
// const wss = new WebSocket.Server({ port: PORT });
// Connect to the database
connectDB();
const newOrderRepostory = new newOrderRepository();
const fetchStocks = new fetchStockRepository();

// Log directory setup
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  const logDirectory = path.join(__dirname, "logs");
  console.log(logDirectory);
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
  }

  const accessLogStream = createStream("access.log", {
    interval: "7d",
    path: logDirectory,
    maxFiles: 5,
  });

  app.use(
    morgan("combined", {
      stream: accessLogStream,
    })
  );
}

console.log("Rotating log stream configured.");

// Middleware for session management
app.use(
  session({
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(cors({ origin: "http://localhost:4200" }));

app.use(express.json());

// Routes
app.use(userRoute);
app.use(adminRoute);
app.use(stockRoute);
app.use((req, res, next) => {
  if (req.path.startsWith("/socket.io")) return next();
  res.status(404).send("Not Found");
});
cron.schedule("* * * * *", async () => {
  console.log("Running order matching...");
  try {
    await newOrderRepostory.matchOrders();
    console.log("Order matching completed.");
  } catch (error) {
    console.error("Error while matching orders:", error);
  }
});
cron.schedule("* * * * *", async () => {
  console.log("Sending live portfolio summary...");
  const stockSymbols = ["AAPL", "GOOGL", "MSFT", "AMZN"];

  try {
    const updatedSummary = await fetchStocks.fetchStockData(stockSymbols);
    io.emit("portfolioSummaryUpdate", updatedSummary); // Broadcast the summary to all connected clients
  } catch (error) {
    console.error("Error fetching live stock data:", error);
  }
});
cron.schedule("15 15 * * *", async () => {
  console.log("Executing auto square off...");
  await autoSquareOff();
});

// Test route
app.get("/", (req: Request, res: Response) => {
  res.send("API is running..");
});

export default app;
