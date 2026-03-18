import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});
export async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  await transporter.sendMail({
    from: `"SmartCart" <${process.env.GMAIL_USER}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}
