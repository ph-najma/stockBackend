import Razorpay from "razorpay";

export const razorpayClient = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_sHq1xf34I99z5x",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "kgjoNUSGoxu5oxGXgImjBG7i",
});
