import { Request, Response } from "express";
import { UserService } from "../services/userService";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
    this.signup = this.signup.bind(this);
    this.verifyOtp = this.verifyOtp.bind(this);
    this.resendOtp = this.resendOtp.bind(this);
    this.login = this.login.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.home = this.home.bind(this);
    this.getUserProfile = this.getUserProfile.bind(this);
    this.plcaeOrder = this.plcaeOrder.bind(this);
  }
  //signup
  async signup(req: Request, res: Response): Promise<void> {
    const { name, email, password } = req.body;
    try {
      await this.userService.signup(name, email, password);
      res.status(200).json({ message: "OTP sent to email", email });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  //verify OTP
  async verifyOtp(req: Request, res: Response): Promise<void> {
    const { otp } = req.body;
    try {
      const result = await this.userService.verifyOtp(otp);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  //Resend OTP
  async resendOtp(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    try {
      const message = await this.userService.resendOtp(email);
      res.status(200).json({ message });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  //Login
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    try {
      const result = await this.userService.login(email, password);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  //Forgot Password
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    try {
      await this.userService.forgotPassword(email);
      res.status(200).json({ message: "OTP sent to email", email });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  //Reset Password
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { email, otp, newPassword } = req.body;
    try {
      await this.userService.resetPassword(email, otp, newPassword);
      res.status(200).json({ message: "Password reset successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  //Home
  async home(req: Request, res: Response): Promise<void> {
    try {
      await this.userService.home();
      res.status(200).json({ message: "Home rendered successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  //User Profile
  async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.getUserProfile(req.userId);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  //User Portfolio
  async getUserportfolio(req: Request, res: Response): Promise<void> {
    try {
      const portfolio = await this.userService.getUserPortfolio(req.userId);
      console.log(req.userId);
      console.log(portfolio);
      res.json(portfolio);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  //placeOrder
  async plcaeOrder(req: Request, res: Response): Promise<void> {
    const { user, stock, type, orderType, quantity, price, stopPrice } =
      req.body;
    const order = await this.userService.placeOrder(
      user,
      stock,
      type,
      orderType,
      quantity,
      price,
      stopPrice
    );
    res.json(order);
  }
}
