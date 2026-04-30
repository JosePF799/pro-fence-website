const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MIN_FORM_FILL_TIME_MS = 2500;
const MAX_FORM_FILL_TIME_MS = 2 * 60 * 60 * 1000;
const submissionAttempts = new Map();

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  const origin = String(req.headers.origin || "");

  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ ok: false, error: "Request blocked." });
  }

  const clientIp = getClientIp(req);

  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      ok: false,
      error: "Too many submissions. Please wait a few minutes and try again."
    });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || "profence@caprofence.com";
  const fromEmail = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

  let body;

  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: "Invalid request."
    });
  }

  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  const project = String(body.project || "Fence Installation").trim();
  const location = String(body.location || "").trim();
  const details = String(body.details || "").trim();
  const companyWebsite = String(body.companyWebsite || "").trim();
  const projectConfirm = String(body.projectConfirm || "").trim();
  const startedAt = Number(body.startedAt || 0);
  const attachment = normalizeAttachment(body.attachment);

  if (companyWebsite) {
    return res.status(200).json({ ok: true });
  }

  if (projectConfirm !== "yes") {
    return res.status(400).json({
      ok: false,
      error: "Please confirm this is a real project request."
    });
  }

  if (!isReasonableFormTiming(startedAt)) {
    return res.status(400).json({
      ok: false,
      error: "Please take a moment to complete the form before submitting."
    });
  }

  if (!name || !phone) {
    return res.status(400).json({
      ok: false,
      error: "Please fill out the required fields."
    });
  }

  if (body.attachment && !attachment) {
    return res.status(400).json({
      ok: false,
      error: "Please attach a photo or PDF under 3 MB."
    });
  }

  if (hasTooManyLinks([name, phone, email, location, details].join(" "))) {
    return res.status(400).json({
      ok: false,
      error: "Please remove extra links from the request and try again."
    });
  }

  if (!resendApiKey) {
    return res.status(503).json({
      ok: false,
      error: "Email delivery is not configured yet."
    });
  }

  const subject = `Estimate Request - ${project}`;
  const text = [
    "New estimate request from caprofence.com",
    "",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Email: ${email || "Not provided"}`,
    `Project Type: ${project}`,
    `Project Location: ${location || "Not provided"}`,
    `Attachment: ${attachment ? attachment.filename : "Not provided"}`,
    "",
    "Project Details:",
    details || "No details provided."
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17211a;">
      <h2 style="margin:0 0 16px;">New estimate request from caprofence.com</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email || "Not provided")}</p>
      <p><strong>Project Type:</strong> ${escapeHtml(project)}</p>
      <p><strong>Project Location:</strong> ${escapeHtml(location || "Not provided")}</p>
      <p><strong>Attachment:</strong> ${escapeHtml(attachment ? attachment.filename : "Not provided")}</p>
      <p><strong>Project Details:</strong></p>
      <p style="white-space:pre-wrap;">${escapeHtml(details || "No details provided.")}</p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email || undefined,
        subject,
        text,
        html,
        attachments: attachment
          ? [
              {
                filename: attachment.filename,
                content: attachment.content,
                content_type: attachment.contentType
              }
            ]
          : undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({
        ok: false,
        error: "Email delivery failed.",
        details: errorText
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Unexpected server error."
    });
  }
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeAttachment(attachment) {
  if (!attachment || typeof attachment !== "object") {
    return null;
  }

  const filename = String(attachment.filename || "").trim();
  const content = String(attachment.content || "").trim();
  const contentType = String(attachment.contentType || "application/octet-stream").trim();
  const size = Number(attachment.size || 0);
  const isAllowedType =
    ["application/pdf", "image/gif", "image/heic", "image/heif", "image/jpeg", "image/png", "image/webp"].includes(contentType) ||
    /\.pdf$/i.test(filename);

  if (!filename || !content || !isAllowedType || !Number.isFinite(size) || size > 3 * 1024 * 1024) {
    return null;
  }

  return {
    filename,
    content,
    contentType
  };
}

function isAllowedOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "caprofence.com" ||
      hostname === "www.caprofence.com" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".vercel.app")
    );
  } catch (error) {
    return false;
  }
}

function getClientIp(req) {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "");
  return forwardedFor.split(",")[0].trim() || String(req.socket?.remoteAddress || "unknown");
}

function isRateLimited(clientIp) {
  const now = Date.now();
  const current = submissionAttempts.get(clientIp) || [];
  const recent = current.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  recent.push(now);
  submissionAttempts.set(clientIp, recent);

  return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

function isReasonableFormTiming(startedAt) {
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    return false;
  }

  const elapsed = Date.now() - startedAt;
  return elapsed >= MIN_FORM_FILL_TIME_MS && elapsed <= MAX_FORM_FILL_TIME_MS;
}

function hasTooManyLinks(value) {
  const links = String(value).match(/https?:\/\/|www\./gi) || [];
  return links.length > 2;
}
