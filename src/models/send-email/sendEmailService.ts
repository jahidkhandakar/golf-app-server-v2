import nodemailer from "nodemailer";
import { OTP } from "./../user/user.model";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const transporter = nodemailer.createTransport({
  // service: "gmail",
  // host: "smtp.gmail.com",
  // port: 465,
  // secure: true,
  host: "mail.betopiagroup.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.Nodemailer_GMAIL,
    pass: process.env.Nodemailer_GMAIL_PASSWORD,
  },
});

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
export const getStoredOTP = async (email: string) => {
  const otpData = await OTP.findOne({ email: email.toLowerCase() });

  if (!otpData) {
    return { status: "not_found", otp: null };
  }

  // Expired case
  if (otpData.expiresAt < new Date()) {
    await OTP.deleteOne({ email: email.toLowerCase() }); // remove expired OTP
    return { status: "expired", otp: null };
  }

  return { status: "valid", otp: otpData.otp, verified: otpData.verified };
};

export const saveOTP = async (email: string, otp: string) => {
  await OTP.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      email: email.toLowerCase(),
      otp,
      expiresAt: new Date(Date.now() + 160 * 1000), // 2 minutes expiry
      verified: false,
    },
    { upsert: true },
  );
};

export const sendOTPEmail = async (
  email: string,
  otp: string,
): Promise<void> => {
  const brandColor = "#A156E8";

  const emailContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Account</title>
    <style>
      body { margin: 0; padding: 0; background-color: #f4f7fa; -webkit-font-smoothing: antialiased; }
      .email-wrapper { width: 100%; table-layout: fixed; background-color: #f4f7fa; padding-bottom: 40px; }
      .email-card { max-width: 480px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #eef2f6; }
      .header { padding: 40px 0 20px; text-align: center; }
      .logo { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 32px; font-weight: 800; color: ${brandColor}; letter-spacing: -1px; }
      .content { padding: 0 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d3436; }
      .title { font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px; text-align: center; }
      .text { font-size: 15px; line-height: 24px; color: #636e72; text-align: center; }
      .otp-box { background-color: #f8faff; border: 1px solid #e1e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0; }
      .otp-label { font-size: 12px; font-weight: 700; color: #a0a0a0; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
      .otp-code { font-size: 40px; font-weight: 800; color: #1a1a1a; letter-spacing: 8px; margin: 0; }
      .timer-badge { display: inline-block; padding: 6px 12px; background-color: #fff2f2; color: #e74c3c; font-size: 13px; font-weight: 600; border-radius: 20px; margin-bottom: 20px; }
      .footer { padding: 20px; text-align: center; font-size: 12px; color: #b2bec3; font-family: sans-serif; }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-card">
        <div class="header">
          <div class="logo">Lynkfolk</div>
        </div>
        <div class="content">
          <h1 class="title">Verification Code</h1>
          <p class="text">To securely sign in to your <strong>Lynkfolk</strong> account, please use the code below. This code will expire shortly.</p>
          
          <div class="otp-box">
            <div class="timer-badge">Valid for 3 minutes</div> 
            <div class="otp-code">${otp}</div>
          </div>
          
          <p class="text" style="font-size: 13px;">If you didn't request this, you can safely ignore this email. Your account security is our priority.</p>
          
          <p class="text" style="margin-top: 30px; font-weight: 600; color: #2d3436;">
            Thanks,<br>Team Lynkfolk
          </p>
        </div>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Lynkfolk Inc. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;

  const mailOptions = {
    from: `"Lynkfolk Security" <${process.env.Nodemailer_GMAIL}>`,
    to: email,
    subject: `${otp} is your Lynkfolk verification code`,
    html: emailContent,
    text: `Your Lynkfolk verification code is ${otp}. Valid for 3 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};

// export const sendOrderSuccessEmailToCustomer = async (
//   customerEmail: string,
//   customerName: string,
//   orderId: string,
//   totalPrice: number,
//   deliveryAddress: string,
//   orderDate: string,
//   menuNames: string[],
// ): Promise<void> => {
//   const brandColor = "#A156E8";

//   const formattedDate = dayjs(orderDate)
//     .tz("UTC")
//     .format("MMMM D, YYYY [at] hh:mm A z");

//   const menuListHtml = menuNames
//     .map((name) => `<li style="margin-bottom:4px;">${name}</li>`)
//     .join("");

//   const emailContent = `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8" />
//       <title>Order Successful</title>
//       <style>
//         body { background:#f4f7fa; margin:0; padding:40px; font-family:Arial, sans-serif; }
//         .card { max-width:520px; margin:auto; background:#fff; border-radius:16px; padding:40px; box-shadow:0 4px 12px rgba(0,0,0,.08); }
//         .logo { text-align:center; font-size:32px; font-weight:800; color:${brandColor}; margin-bottom:20px; }
//         .title { text-align:center; font-size:22px; font-weight:700; color:#2d3436; }
//         .text { text-align:center; font-size:15px; color:#636e72; line-height:24px; }
//         .box { background:#f8f9ff; border:1px solid #e6e9f5; border-radius:12px; padding:24px; margin:32px 0; text-align:left; }
//         .status { font-size:13px; font-weight:700; color:#27ae60; letter-spacing:1px; text-transform:uppercase; }
//         .order-id { font-size:14px; font-weight:600; color:#0984e3; margin-top:8px; }
//         .amount { font-size:18px; font-weight:700; margin-top:12px; color:#2d3436; }
//         .time { font-size:13px; color:#636e72; margin-top:12px; }
//         .address { font-size:14px; color:#2d3436; margin-top:16px; }
//         .menu-list { font-size:14px; color:#2d3436; margin-top:12px; padding-left:16px; }
//         .footer { text-align:center; font-size:12px; color:#b2bec3; margin-top:30px; }
//       </style>
//     </head>
//     <body>
//       <div class="card">
//         <div class="logo">Food Delivery</div>

//         <h1 class="title">Order Placed Successfully ✅</h1>

//         <p class="text">
//           Hi ${customerName},<br />
//           Your order has been successfully placed and is now being processed.
//         </p>

//         <div class="box">
//           <div class="status">Status: Order Placed</div>
//           <div class="order-id">Order ID: ${orderId}</div>
//           <div class="amount">Total: $${totalPrice.toFixed(2)}</div>
//           <div class="time">
//             Ordered on <strong>${formattedDate}</strong>
//           </div>
//           <div class="address">
//             Delivery Address:<br />
//             <strong>${deliveryAddress}</strong>
//           </div>
//           <div class="menu-list">
//             <strong>Items Ordered:</strong>
//             <ul>${menuListHtml}</ul>
//           </div>
//         </div>

//         <p class="text">
//           Your order will be prepared shortly. You can track your order in the app or dashboard.
//         </p>

//         <p class="text" style="font-weight:600; margin-top:24px; color:#2d3436;">
//           Thank you for ordering with Food Delivery!<br />
//           Team Food Delivery
//         </p>

//         <div class="footer">
//           © ${new Date().getFullYear()} Food Delivery. All rights reserved.
//         </div>
//       </div>
//     </body>
//     </html>
//   `;

//   await transporter.sendMail({
//     from: `"Food Delivery Notifications" <${process.env.Nodemailer_GMAIL}>`,
//     to: customerEmail,
//     subject: `Your order was placed successfully (#${orderId})`,
//     html: emailContent,
//     text: `Hello ${customerName},

//       Your order has been successfully placed!

//       Order ID: ${orderId}
//       Total: $${totalPrice.toFixed(2)}
//       Delivery Address: ${deliveryAddress}
//       Ordered on: ${formattedDate}

//       Items Ordered:
//       ${menuNames.join("\n")}

//       Thank you for ordering with Food Delivery!`,
//   });
// };

// export const sendOrderDeliveredEmailToCustomer = async (
//   customerEmail: string,
//   customerName: string,
//   orderId: string,
//   totalPrice: number,
//   deliveryAddress: string,
//   orderDate: string,
//   menuNames: string[],
// ): Promise<void> => {
//   const brandColor = "#A156E8";

//   const formattedDate = dayjs(orderDate)
//     .tz("UTC")
//     .format("MMMM D, YYYY [at] hh:mm A z");

//   const menuListHtml = menuNames
//     .map((name) => `<li style="margin-bottom:4px;">${name}</li>`)
//     .join("");

//   const emailContent = `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8" />
//       <title>Order Delivered</title>
//       <style>
//         body { background:#f4f7fa; margin:0; padding:40px; font-family:Arial, sans-serif; }
//         .card { max-width:520px; margin:auto; background:#fff; border-radius:16px; padding:40px; box-shadow:0 4px 12px rgba(0,0,0,.08); }
//         .logo { text-align:center; font-size:32px; font-weight:800; color:${brandColor}; margin-bottom:20px; }
//         .title { text-align:center; font-size:22px; font-weight:700; color:#2d3436; }
//         .text { text-align:center; font-size:15px; color:#636e72; line-height:24px; }
//         .box { background:#f8f9ff; border:1px solid #e6e9f5; border-radius:12px; padding:24px; margin:32px 0; text-align:left; }
//         .status { font-size:13px; font-weight:700; color:#27ae60; letter-spacing:1px; text-transform:uppercase; }
//         .order-id { font-size:14px; font-weight:600; color:#0984e3; margin-top:8px; }
//         .amount { font-size:18px; font-weight:700; margin-top:12px; color:#2d3436; }
//         .time { font-size:13px; color:#636e72; margin-top:12px; }
//         .address { font-size:14px; color:#2d3436; margin-top:16px; }
//         .menu-list { font-size:14px; color:#2d3436; margin-top:12px; padding-left:16px; }
//         .footer { text-align:center; font-size:12px; color:#b2bec3; margin-top:30px; }
//       </style>
//     </head>
//     <body>
//       <div class="card">
//         <div class="logo">Food Delivery</div>

//         <h1 class="title">Order Delivered Successfully 🎉</h1>

//         <p class="text">
//           Hi ${customerName},<br />
//           Your order has been delivered successfully. We hope you enjoy your meal!
//         </p>

//         <div class="box">
//           <div class="status">Status: Delivered</div>
//           <div class="order-id">Order ID: ${orderId}</div>
//           <div class="amount">Total: $${totalPrice.toFixed(2)}</div>
//           <div class="time">
//             Ordered on <strong>${formattedDate}</strong>
//           </div>
//           <div class="address">
//             Delivery Address:<br />
//             <strong>${deliveryAddress}</strong>
//           </div>
//           <div class="menu-list">
//             <strong>Items Delivered:</strong>
//             <ul>${menuListHtml}</ul>
//           </div>
//         </div>

//         <p class="text">
//           Thank you for ordering with us! We’d love to hear your feedback.
//         </p>

//         <p class="text" style="font-weight:600; margin-top:24px; color:#2d3436;">
//           Bon appétit!<br />
//           Team Food Delivery
//         </p>

//         <div class="footer">
//           © ${new Date().getFullYear()} Food Delivery. All rights reserved.
//         </div>
//       </div>
//     </body>
//     </html>
//   `;

//   await transporter.sendMail({
//     from: `"Food Delivery Notifications" <${process.env.Nodemailer_GMAIL}>`,
//     to: customerEmail,
//     subject: `Your order was delivered successfully (#${orderId})`,
//     html: emailContent,
//     text: `Hello ${customerName},

// Your order has been delivered successfully!

// Order ID: ${orderId}
// Total: $${totalPrice.toFixed(2)}
// Delivery Address: ${deliveryAddress}
// Ordered on: ${formattedDate}

// Items Delivered:
// ${menuNames.join("\n")}

// Thank you for ordering with Food Delivery!`,
//   });
// };
