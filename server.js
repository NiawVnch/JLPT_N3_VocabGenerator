const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3001;

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "jlpt_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

// Health check
app.get("/api/health", async (req, res) => {
  res.json({
    ok: true,
    message: "JLPT N3 Flashcard server is running",
  });
});

// Get total vocabulary count
app.get("/api/vocabulary/count", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total FROM jlpt_n3_vocabulary"
    );

    res.json({
      total: rows[0].total,
    });
  } catch (error) {
    console.error("Count error:", error);
    res.status(500).json({
      error: "Failed to count vocabulary",
    });
  }
});

// Get one random vocabulary, excluding already used ids
app.post("/api/vocabulary/random", async (req, res) => {
  try {
    const usedIds = Array.isArray(req.body.usedIds) ? req.body.usedIds : [];

    let query = `
      SELECT id, vocabulary, romaji, reading, meaning
      FROM jlpt_n3_vocabulary
    `;

    const params = [];

    if (usedIds.length > 0) {
      const placeholders = usedIds.map(() => "?").join(",");
      query += ` WHERE id NOT IN (${placeholders})`;
      params.push(...usedIds);
    }

    // RAND() gives real random distribution across remaining rows
    query += " ORDER BY RAND() LIMIT 1";

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
      return res.json({
        finished: true,
        message: "All vocabulary has been used. Please reset random memory.",
      });
    }

    res.json({
      finished: false,
      item: rows[0],
    });
  } catch (error) {
    console.error("Random error:", error);
    res.status(500).json({
      error: "Failed to get random vocabulary",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`JLPT N3 Flashcard app running at http://localhost:${PORT}`);
  console.log(`For other devices, open http://SERVER_IP:${PORT}`);
});