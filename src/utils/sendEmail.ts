import nodemailer from "nodemailer";
//====SEND EMAIL=============//
export const sendEmail = async (email: string, otp: string) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_MAIL!,
        pass: process.env.SMTP_PASSWORD!,
      },
      tls: {
        rejectUnauthorized: true,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_MAIL!,
      to: email,
      subject: "Your OTP for user verification",
      text: `Your OTP is ${otp}. Please enter this code to verify your account.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending OTP email:", error);
        return;
      }
      console.log("OTP email sent:", info.response);
    });
  } catch (error) {
    console.error("Error in sending email:", error);
  }
};
