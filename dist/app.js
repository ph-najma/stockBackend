"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchOrders = exports.fetchStockData = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const axios_1 = __importDefault(require("axios"));
const node_cron_1 = __importDefault(require("node-cron"));
const stockModel_1 = __importDefault(require("./models/stockModel"));
const transactionModel_1 = __importDefault(require("./models/transactionModel"));
const orderModel_1 = __importDefault(require("./models/orderModel"));
const userModel_1 = __importDefault(require("./models/userModel"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Create the express app
const app = (0, express_1.default)();
// Connect to the database
(0, db_1.default)();
// Middleware for session management
app.use((0, express_session_1.default)({
    secret: "my-secret-key", // Secret key for signing the session
    resave: false,
    saveUninitialized: true,
}));
// Initialize passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Enable CORS
app.use((0, cors_1.default)({ origin: "http://localhost:4200" }));
// Middleware to parse JSON
app.use(express_1.default.json());
// Use morgan middleware for logging HTTP requests
if (process.env.NODE_ENV === "development") {
    // Logs detailed information (e.g., method, url, response time)
    app.use((0, morgan_1.default)("dev")); // You can use other formats like 'tiny' or 'combined'
}
else {
    // In production, use a more concise format and log to a file
    const fs = require("fs");
    const path = require("path");
    // Create a write stream (in append mode)
    const logStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
        flags: "a",
    });
    // Log requests to the access.log file
    app.use((0, morgan_1.default)("combined", { stream: logStream }));
}
// Routes
app.use(userRoutes_1.default);
app.use(adminRoutes_1.default);
node_cron_1.default.schedule("* * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Running order matching...");
    try {
        yield (0, exports.matchOrders)(); // Call your order matching function
        console.log("Order matching completed.");
    }
    catch (error) {
        console.error("Error while matching orders:", error);
    }
}));
node_cron_1.default.schedule("* * * * *", () => {
    console.log("Fetching stock data...");
    (0, exports.fetchStockData)("AAPL"); // Replace 'AAPL' with your desired stock symbol
});
const fetchStockData = (symbol) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get("https://www.alphavantage.co/query", {
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
        const stock = new stockModel_1.default({
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
        yield stock.save();
        console.log("Stock data saved:", stock);
    }
    catch (error) {
        console.error("Error fetching stock data:", error);
    }
});
exports.fetchStockData = fetchStockData;
const matchOrders = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const marketOrders = yield orderModel_1.default.find({ status: "PENDING" });
        for (const order of marketOrders) {
            const { orderType, type, price, quantity, stock } = order;
            const oppositeSide = type === "BUY" ? "SELL" : "BUY";
            const stockDoc = yield stockModel_1.default.findById(stock);
            if (!stockDoc) {
                console.error(`Stock with ID ${stock} not found`);
                continue;
            }
            let bestOrder = yield orderModel_1.default.findOne(Object.assign({ stock, type: oppositeSide, status: "PENDING" }, (orderType === "LIMIT"
                ? { price: type === "BUY" ? { $lte: price } : { $gte: price } }
                : {}))).sort(orderType === "MARKET"
                ? { price: type === "BUY" ? -1 : 1 }
                : { createdAt: 1 });
            if (bestOrder) {
                const matchPrice = bestOrder.price;
                const matchedQuantity = Math.min(quantity, bestOrder.quantity);
                // Update orders
                order.quantity -= matchedQuantity;
                bestOrder.quantity -= matchedQuantity;
                if (order.quantity === 0)
                    order.status = "COMPLETED";
                if (bestOrder.quantity === 0)
                    bestOrder.status = "COMPLETED";
                yield order.save();
                yield bestOrder.save();
                // Update stock price
                stockDoc.price = matchPrice;
                yield stockDoc.save();
                // Create transaction
                const fees = 0.01 * matchPrice * matchedQuantity;
                const transaction = yield transactionModel_1.default.create([
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
                const buyer = yield userModel_1.default.findById(transaction[0].buyer);
                const seller = yield userModel_1.default.findById(transaction[0].seller);
                if (buyer) {
                    // Update buyer's portfolio
                    const existingStock = buyer.portfolio.find((portfolioItem) => portfolioItem.stockId === stockDoc._id);
                    if (type === "BUY") {
                        // Add stock to buyer's portfolio
                        if (existingStock) {
                            existingStock.quantity += matchedQuantity;
                        }
                        else {
                            buyer.portfolio.push({
                                stockId: stockDoc._id,
                                quantity: matchedQuantity,
                            });
                        }
                    }
                    else if (type === "SELL") {
                        // Remove stock from buyer's portfolio (if they had it)
                        if (existingStock) {
                            existingStock.quantity -= matchedQuantity;
                            if (existingStock.quantity === 0) {
                                buyer.portfolio = buyer.portfolio.filter((item) => item.stockId !== stockDoc._id);
                            }
                        }
                    }
                    yield buyer.save();
                }
                if (seller) {
                    // Update seller's portfolio (reverse the transaction)
                    const existingStock = seller.portfolio.find((portfolioItem) => portfolioItem.stockId === stockDoc._id);
                    if (type === "SELL") {
                        // Add stock to seller's portfolio
                        if (existingStock) {
                            existingStock.quantity += matchedQuantity;
                        }
                        else {
                            seller.portfolio.push({
                                stockId: stockDoc._id,
                                quantity: matchedQuantity,
                            });
                        }
                    }
                    else if (type === "BUY") {
                        // Remove stock from seller's portfolio (if they had it)
                        if (existingStock) {
                            existingStock.quantity -= matchedQuantity;
                            if (existingStock.quantity === 0) {
                                seller.portfolio = seller.portfolio.filter((item) => item.stockId !== stockDoc._id);
                            }
                        }
                    }
                    yield seller.save();
                }
            }
        }
        console.log("Order matching completed successfully");
    }
    catch (error) {
        console.error("Error matching orders:", error);
    }
});
exports.matchOrders = matchOrders;
// Test route
app.get("/", (req, res) => {
    res.send("API is running..");
});
exports.default = app;
