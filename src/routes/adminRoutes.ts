import express, { Router } from "express";
import { verifyAdminToken } from "../middleware/auth";
import { AdminController } from "../controllers/adminController";
import { AdminService } from "../services/adminService";
const adminController = new AdminController(new AdminService());
const router: Router = express.Router();

router.post("/adminLogin", adminController.login);
router.get("/userList", verifyAdminToken, adminController.getUserList);
router.post("/disableUser/:id", verifyAdminToken, adminController.disableUser);
router.get("/stocks", adminController.getStockList);
router.get("/stocklist", adminController.getStockList);
router.put("/softDeleteStock/:id", adminController.softDeleteStock);
router.get("/orders", adminController.getAllOrders);
router.get("/limitorders", adminController.getLimitOrders);
router.get("/marketorders", adminController.getMarketOrders);
router.get("/matchedorders", adminController.getMatchedOrders);
router.get("/orderDetails/:orderId", adminController.getOrderDetails);
export default router;
