import express, { Router } from "express";
import { verifyTokenWithRole } from "../middleware/auth";
import { AdminController } from "../controllers/adminController";
import { AdminService } from "../services/adminService";
import { UserRepository } from "../repositories/userRepository";
import { limitRepository } from "../repositories/limitRepository";
import { StockRepository } from "../repositories/stockrepository";
import { OrderRepository } from "../repositories/orderRepository";
import { transactionRepository } from "../repositories/transactionRepository";
import { PromotionRepository } from "../repositories/promotionRepository";
const userRepository = new UserRepository();
const LimitRepository = new limitRepository();
const orderRepository = new OrderRepository();
const stockRepository = new StockRepository();
const promotionRepository = new PromotionRepository();
const TransactionRepository = new transactionRepository();
const adminController = new AdminController(
  new AdminService(
    userRepository,
    LimitRepository,
    orderRepository,
    stockRepository,
    TransactionRepository,
    promotionRepository
  )
);
const router: Router = express.Router();

router.post("/adminLogin", adminController.login);
router.get(
  "/userList",
  verifyTokenWithRole("admin"),
  adminController.getUserList
);
router.post(
  "/disableUser/:id",
  verifyTokenWithRole("admin"),
  adminController.disableUser
);
router.get("/stocks", adminController.getStockList);
router.get(
  "/stocklist",
  verifyTokenWithRole("admin"),
  adminController.getStockList
);
router.put(
  "/softDeleteStock/:id",
  verifyTokenWithRole("admin"),
  adminController.softDeleteStock
);
router.get(
  "/orders",
  verifyTokenWithRole("admin"),
  adminController.getAllOrders
);
router.get(
  "/limitorders",
  verifyTokenWithRole("admin"),
  adminController.getLimitOrders
);
router.get(
  "/marketorders",
  verifyTokenWithRole("admin"),
  adminController.getMarketOrders
);
router.get("/matchedorders", adminController.getMatchedOrders);
router.get(
  "/orderDetails/:orderId",
  verifyTokenWithRole("admin"),
  adminController.getOrderDetails
);
router.get(
  "/allTransactions",
  verifyTokenWithRole("admin"),
  adminController.getAllTransactions
);
router.get(
  "/userPortfolio/:userId",
  verifyTokenWithRole("admin"),
  adminController.getUserPortfolio
);
router.get(
  "/getFees",
  verifyTokenWithRole("admin"),
  adminController.getTotalFeesCollected
);
router.post(
  "/changeStatus/:orderId",
  verifyTokenWithRole("admin"),
  adminController.cancelOrder
);
router.post(
  "/updateLimit",
  verifyTokenWithRole("admin"),
  adminController.updateLimit
);
router.post("/createPromotions", adminController.CreatePromotions);
router.get("/limit", verifyTokenWithRole("admin"), adminController.getLimits);
export default router;
