// Fetches one tab of the public Google Sheet as CSV and returns it as JSON rows.
// Contact details never leave the server: email columns are dropped, and phone columns are
// replaced by "valid" / "invalid" / "" so the dashboard can check a number was entered.

const SHEET_ID = process.env.SHEET_ID || "1yGSvua5cQm0Czz4_Mr-dW9WmjgDP1PWVcP14n7pX8z0";
const ALLOWED_TABS = ["Sales_call_log", "Reactivation", "LEAD-GEN"];
const EMAIL_COLUMN = /e-?mail/i;
const PHONE_COLUMN = /phone/i;

// "2.51912E+11" is how Sheets exports a long number; anything with 7+ digits is a plausible phone.
function phoneQuality(v) {
  v = String(v || "").trim();
  if (!v) return "";
  return /e\+/i.test(v) || v.replace(/\D/g, "").length >= 7 ? "valid" : "invalid";
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

module.exports = async (req, res) => {
  const password = process.env.DASHBOARD_PASSWORD;
  if (password && req.headers["x-dashboard-key"] !== password) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const tab = req.query.tab;
  if (!ALLOWED_TABS.includes(tab)) {
    return res.status(400).json({ error: `tab must be one of ${ALLOWED_TABS.join(", ")}` });
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Google returned ${r.status}`);
    const [header = [], ...body] = parseCsv(await r.text());
    const keep = header
      .map((name, i) => ({ name: name.trim(), i, phone: PHONE_COLUMN.test(name) }))
      .filter((c) => c.name && !EMAIL_COLUMN.test(c.name));
    const rows = [];
    body.forEach((cells, idx) => {
      if (!cells.some((v) => v.trim() !== "")) return;
      const row = { __row: idx + 2 }; // sheet row number (header is row 1)
      for (const c of keep) {
        const v = (cells[c.i] || "").trim();
        row[c.name] = c.phone ? phoneQuality(v) : v;
      }
      rows.push(row);
    });

    // Cache at Vercel's edge for 60s so many viewers don't hammer Google.
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({ tab, fetchedAt: new Date().toISOString(), rows });
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
};
