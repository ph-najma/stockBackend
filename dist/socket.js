"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const server = http_1.default.createServer(app_1.default);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:4200", // Adjust as per your frontend origin
        methods: ["GET", "POST"],
    },
});
exports.io = io;
// Handle client connection
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("error", (err) => {
        console.error(`Socket error for ${socket.id}:`, err);
    });
    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});
server.listen(5000, () => {
    console.log("socket io server running");
});
