import express from "express";
import morgan from "morgan";
import path from "path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import tasksRouter from "./routes/tasks.js";
import authRouter from "./routes/auth.js";
import { requireAuth } from "./middleware/auth.js";
import { hasDatabase, pool } from "./db.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.disable("x-powered-by");
app.use(express.json());
app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/tasks", requireAuth, tasksRouter);

export default app;

async function initDb() {
  if (!hasDatabase) return;
  const schemaPath = path.join(__dirname, "..", "sql", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  await pool.query(sql);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  try {
    await initDb();
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }
  app.listen(port, () => {
    console.log(`TaskFlow API listening on port ${port}`);
  });
}
