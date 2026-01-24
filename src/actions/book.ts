import { getBrowser } from "../browser/getBrowser.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function bookAction(payload: any) {
  const { siteUrl, form } = payload;

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.goto(siteUrl, { waitUntil: "networkidle" });

    for (const field of form.fields) {
      await page.fill(field.selector, field.value);
    }

    await Promise.all([
      page.click(form.submitSelector),
      page.waitForNavigation({ waitUntil: "networkidle" })
    ]);

    const confirmationHtml = await page.content();

    // owner notification
    if (process.env.OWNER_EMAIL) {
      await transporter.sendMail({
        to: process.env.OWNER_EMAIL,
        subject: "NEO извърши резервация",
        text: `
NEO направи резервация.

Сайт: ${siteUrl}
Дата: ${new Date().toISOString()}
`
      });
    }

    return {
      success: true,
      status: "success",
      confirmationHtml
    };
  } catch (e) {
    return {
      success: false,
      status: "failed",
      error: e instanceof Error ? e.message : String(e)
    };
  } finally {
    await page.close();
  }
}
