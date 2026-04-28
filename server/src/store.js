import { hasDatabase, pool } from "./db.js";

const validStatuses = new Set(["pendente", "em andamento", "concluida"]);

let nextId = 1;
const tasks = [];

function normalizeStatus(status) {
  if (!status) {
    return "pendente";
  }

  const normalized = String(status).trim().toLowerCase();
  return normalized;
}

function buildTask(payload) {
  if (!payload || !payload.title) {
    throw new Error("title is required");
  }

  const status = normalizeStatus(payload.status);
  if (!validStatuses.has(status)) {
    throw new Error("invalid status");
  }

  return {
    title: String(payload.title).trim(),
    description: payload.description ? String(payload.description).trim() : "",
    dueDate: payload.dueDate ? String(payload.dueDate).trim() : "",
    status,
    assignee: payload.assignee ? String(payload.assignee).trim() : ""
  };
}

function applyUpdates(task, payload) {
  const updated = { ...task };

  if (payload.title !== undefined) {
    if (!payload.title) {
      throw new Error("title is required");
    }
    updated.title = String(payload.title).trim();
  }

  if (payload.description !== undefined) {
    updated.description = payload.description ? String(payload.description).trim() : "";
  }

  if (payload.dueDate !== undefined) {
    updated.dueDate = payload.dueDate ? String(payload.dueDate).trim() : "";
  }

  if (payload.assignee !== undefined) {
    updated.assignee = payload.assignee ? String(payload.assignee).trim() : "";
  }

  if (payload.status !== undefined) {
    const status = normalizeStatus(payload.status);
    if (!validStatuses.has(status)) {
      throw new Error("invalid status");
    }
    updated.status = status;
  }

  return updated;
}

function mapRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date ?? row.dueDate ?? "",
    status: row.status,
    assignee: row.assignee
  };
}

export async function listTasks() {
  if (!hasDatabase) {
    return tasks.map((task) => ({ ...task }));
  }

  const result = await pool.query(
    "SELECT id, title, description, due_date, status, assignee FROM tasks ORDER BY id"
  );
  return result.rows.map(mapRow);
}

export async function getTask(id) {
  const taskId = Number(id);
  if (!hasDatabase) {
    const task = tasks.find((item) => item.id === taskId);
    return task ? { ...task } : null;
  }

  const result = await pool.query(
    "SELECT id, title, description, due_date, status, assignee FROM tasks WHERE id = $1",
    [taskId]
  );
  return mapRow(result.rows[0]);
}

export async function createTask(payload) {
  const task = buildTask(payload);

  if (!hasDatabase) {
    const stored = { id: nextId++, ...task };
    tasks.push(stored);
    return { ...stored };
  }

  const result = await pool.query(
    "INSERT INTO tasks (title, description, due_date, status, assignee) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, description, due_date, status, assignee",
    [task.title, task.description, task.dueDate, task.status, task.assignee]
  );

  return mapRow(result.rows[0]);
}

export async function updateTask(id, payload) {
  const taskId = Number(id);

  if (!hasDatabase) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return null;
    }

    const updated = applyUpdates(task, payload);
    Object.assign(task, updated);
    return { ...task };
  }

  const existing = await getTask(taskId);
  if (!existing) {
    return null;
  }

  const updated = applyUpdates(existing, payload);
  const result = await pool.query(
    "UPDATE tasks SET title = $2, description = $3, due_date = $4, status = $5, assignee = $6 WHERE id = $1 RETURNING id, title, description, due_date, status, assignee",
    [taskId, updated.title, updated.description, updated.dueDate, updated.status, updated.assignee]
  );

  return mapRow(result.rows[0]);
}

export async function deleteTask(id) {
  const taskId = Number(id);

  if (!hasDatabase) {
    const index = tasks.findIndex((item) => item.id === taskId);
    if (index === -1) {
      return false;
    }

    tasks.splice(index, 1);
    return true;
  }

  const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING id", [taskId]);
  return result.rowCount > 0;
}

export async function resetStore() {
  if (!hasDatabase) {
    tasks.length = 0;
    nextId = 1;
    return;
  }

  await pool.query("DELETE FROM tasks");
}

export const statuses = Array.from(validStatuses);