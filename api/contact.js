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

  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || "profence@caprofence.com";
  const fromEmail = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

  if (!resendApiKey) {
    return res.status(503).json({
      ok: false,
      error: "Email delivery is not configured yet."
    });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  const project = String(body.project || "Fence Installation").trim();
  const location = String(body.location || "").trim();
  const details = String(body.details || "").trim();

  if (!name || !phone) {
    return res.status(400).json({
      ok: false,
      error: "Please fill out the required fields."
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
        html
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
