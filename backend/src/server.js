require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { sql, getPool } = require("./db");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((item) => item.trim())
    : "http://localhost:5173"
}));
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", async (_req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query("SELECT 1 AS ok");
    res.json({ status: "healthy", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({ status: "unhealthy", database: "unavailable" });
  }
});

app.get("/api/tasks", async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT Id, Title, Description, IsCompleted, CreatedAt
      FROM dbo.Tasks
      ORDER BY CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("List tasks failed:", error.message);
    res.status(500).json({ error: "Could not retrieve tasks." });
  }
});

app.post("/api/tasks", async (req, res) => {
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body.description === "string"
    ? req.body.description.trim()
    : "";

  if (!title || title.length > 200 || description.length > 1000) {
    return res.status(400).json({
      error: "A title (1–200 characters) is required; description must be at most 1000 characters."
    });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("title", sql.NVarChar(200), title)
      .input("description", sql.NVarChar(1000), description || null)
      .query(`
        INSERT INTO dbo.Tasks (Title, Description)
        OUTPUT INSERTED.Id, INSERTED.Title, INSERTED.Description,
               INSERTED.IsCompleted, INSERTED.CreatedAt
        VALUES (@title, @description)
      `);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error("Create task failed:", error.message);
    res.status(500).json({ error: "Could not create task." });
  }
});

app.patch("/api/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1 || typeof req.body.isCompleted !== "boolean") {
    return res.status(400).json({ error: "A valid task ID and boolean isCompleted are required." });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("isCompleted", sql.Bit, req.body.isCompleted)
      .query(`
        UPDATE dbo.Tasks
        SET IsCompleted = @isCompleted
        OUTPUT INSERTED.Id, INSERTED.Title, INSERTED.Description,
               INSERTED.IsCompleted, INSERTED.CreatedAt
        WHERE Id = @id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Update task failed:", error.message);
    res.status(500).json({ error: "Could not update task." });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "A valid task ID is required." });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM dbo.Tasks WHERE Id = @id");

    if (!result.rowsAffected[0]) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.status(204).end();
  } catch (error) {
    console.error("Delete task failed:", error.message);
    res.status(500).json({ error: "Could not delete task." });
  }
});

app.listen(port, () => {
  console.log(`Task Tracker API listening on port ${port}`);
});
