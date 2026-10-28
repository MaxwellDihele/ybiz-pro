const nodemailer = require("nodemailer");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 5000;

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  // Basic same-origin protection when the browser supplies an Origin header.
  const origin = req.headers.origin;
  const expectedHost = req.headers.host;
  if (origin && expectedHost) {
    try {
      if (new URL(origin).host !== expectedHost) {
        return res.status(403).json({ error: "Request origin not allowed." });
      }
    } catch {
      return res.status(403).json({ error: "Invalid request origin." });
    }
  }

  const body = req.body || {};
  // Hidden honeypot field used to catch basic automated spam.
  if (cleanText(body.website, 200)) {
    return res.status(200).json({ success: true, message: "Your enquiry has been received." });
  }

  const email = cleanText(body.email, 254).toLowerCase();
  const reason = cleanText(body.reason, 100);
  const message = cleanText(body.message, MAX_MESSAGE_LENGTH);
  const allowedReasons = new Set([
    "Website Development",
    "E-commerce Solutions",
    "Company Registration",
    "Business Registration & Management",
    "General Enquiry",
    "Other",
  ]);

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (!allowedReasons.has(reason)) {
    return res.status(400).json({ error: "Please select a valid enquiry reason." });
  }

  const requiredEnv = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "CONTACT_TO_EMAIL"];
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error("Contact form configuration missing:", missing.join(", "));
    return res.status(500).json({ error: "The contact service is not configured yet. Please try again later." });
  }

  const port = Number(process.env.SMTP_PORT);
  if (!Number.isInteger(port) || port <= 0) {
    console.error("SMTP_PORT must be a valid port number.");
    return res.status(500).json({ error: "The contact service is temporarily unavailable." });
  }
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE.toLowerCase() === "true"
    : port === 465;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const safeEmail = escapeHtml(email);
    const safeReason = escapeHtml(reason);
    const safeMessage = escapeHtml(message || "(No message provided)").replace(/\n/g, "<br>");

    await transporter.sendMail({
      // Use a sender address belonging to your SMTP provider; visitor email is Reply-To.
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: process.env.CONTACT_TO_EMAIL,
      replyTo: email,
      subject: `YBiz website enquiry: ${reason}`,
      text: [
        "New enquiry from the YBiz website", "", `Visitor email: ${email}`,
        `Reason: ${reason}`, "", "Message:", message || "(No message provided)",
      ].join("\n"),
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#101e3a"><h2>New YBiz website enquiry</h2><p><strong>Visitor email:</strong> ${safeEmail}</p><p><strong>Enquiry type:</strong> ${safeReason}</p><p><strong>Message:</strong><br>${safeMessage}</p></div>`,
    });

    return res.status(200).json({
      success: true,
      message: "Thanks! Your enquiry has been sent. We’ll get back to you as soon as possible.",
    });
  } catch (error) {
    console.error("YBiz contact email failed:", error && error.message ? error.message : error);
    return res.status(500).json({ error: "We couldn't send your enquiry right now. Please try again later or email info@ybiz.co.za." });
  }
};
