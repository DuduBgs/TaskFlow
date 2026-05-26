import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import tasksRouter from "./routes/tasks.js";
import authRouter from "./routes/auth.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/tasks", requireAuth, tasksRouter);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
});

const path = require("node:path");
const url = require("node:url");