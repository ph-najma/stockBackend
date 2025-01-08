import { Server } from "socket.io";
import http from "http";
import app from "./app"; // Your express app
import { StockRepository } from "./repositories/stockrepository";
const stockrepository = new StockRepository();
const server = http.createServer(app); // Create HTTP server using the express app

const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200", // Adjust as per your frontend origin
    methods: ["GET", "POST"],
  },
});

// Handle client connection for socket.io
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Set an interval to emit stock data and mock updates periodically
  const interval = setInterval(async () => {
    // Fetch live stock data from repository
    const liveStockData = await stockrepository.getAllStocks();
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
  }, 5000); // Update every 5 seconds

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

export { io };
