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
exports.io = void 0;
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app")); // Your express app
const stockrepository_1 = require("./repositories/stockrepository");
const stockrepository = new stockrepository_1.StockRepository();
const server = http_1.default.createServer(app_1.default); // Create HTTP server using the express app
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:4200", // Adjust as per your frontend origin
        methods: ["GET", "POST"],
    },
});
exports.io = io;
// Handle client connection for socket.io
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    // Set an interval to emit stock data and mock updates periodically
    const interval = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        // Fetch live stock data from repository
        const liveStockData = yield stockrepository.getAllStocks();
        socket.emit("stockUpdate", liveStockData); // Emit real-time stock data
        // Mock stock data update (for testing purposes)
        //   const mockStockUpdate = {
        //     date: new Date().toISOString(),
        //     open: Math.random() * 100 + 50, // Random value between 50 and 150
        //     high: Math.random() * 100 + 55,
        //     low: Math.random() * 100 + 45,
        //     close: Math.random() * 100 + 50,
        //     volume: Math.floor(Math.random() * 1000 + 100), // Random volume between 100 and 1100
        //   };
        //   socket.emit("stock-update", mockStockUpdate); // Emit mock stock data
        //   const mockTransactionUpdate = {
        //     createdAt: new Date().toISOString(),
        //     price: mockStockUpdate.close, // Use the closing price from the stock update
        //     quantity: Math.floor(Math.random() * 10 + 1), // Random quantity between 1 and 10
        //   };
        //   socket.emit("transaction-update", mockTransactionUpdate); // Emit mock transaction data
        // }, 5000);
    }), 5000); // Update every 5 seconds
    socket.on("error", (err) => {
        console.error(`Socket error for ${socket.id}:`, err);
    });
    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        clearInterval(interval); // Clear the interval on disconnect
    });
});
// Start the combined HTTP server (Express + Socket.IO) on port 5000
server.listen(5000, () => {
    console.log("Server (Express + Socket.IO) running on port 5000");
});
