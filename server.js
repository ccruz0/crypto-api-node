const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors({ origin: "*"}));
app.use(express.json());

// ENV necesarias (se cargan en Render)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Faltan SUPABASE_URL o SUPABASE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", runtime: "node", ok: true });
});

app.get("/signals/live", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 500);
    const symbols = (req.query.symbols || "")
      .split(",")
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    let q = supabase
      .from("signals")
      .select("symbol,side,price,confidence,note,ts,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (symbols.length) q = q.in("symbol", symbols);

    const { data, error } = await q;
    if (error) throw error;

    res.json({ rows: data || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error", detail: String(err.message || err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on port ${PORT}`);
});
