import { Router } from "express";
import { createTask, deleteTask, getTask, listTasks, statuses, updateTask } from "../store.js";

const router = Router();

router.get("/", async (req, res) => {
  const tasks = await listTasks();
  res.json({ data: tasks });
});

router.post("/", async (req, res) => {
  try {
    const task = await createTask(req.body);
    res.status(201).json({ data: task });
  } catch (error) {
    res.status(400).json({ error: error.message, statuses });
  }
});

router.get("/:id", async (req, res) => {
  const task = await getTask(req.params.id);
  if (!task) {
    res.status(404).json({ error: "task not found" });
    return;
  }

  res.json({ data: task });
});

router.put("/:id", async (req, res) => {
  try {
    const task = await updateTask(req.params.id, req.body);
    if (!task) {
      res.status(404).json({ error: "task not found" });
      return;
    }

    res.json({ data: task });
  } catch (error) {
    res.status(400).json({ error: error.message, statuses });
  }
});

router.delete("/:id", async (req, res) => {
  const deleted = await deleteTask(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "task not found" });
    return;
  }

  res.status(204).send();
});

export default router;