import dotenv from "dotenv";

dotenv.config({
  path: ".env.test",
});

import test from "node:test";
import assert from "node:assert/strict";

import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  resetStore,
  updateTask,
} from "../src/store.js";

test("createTask stores and returns task", async () => {
  await resetStore();

  const task = await createTask({ title: "Primeira tarefa", status: "pendente" });

  assert.equal(task.id, 1);
  assert.equal(task.title, "Primeira tarefa");
  const tasks = await listTasks();
  assert.equal(tasks.length, 1);
});

test("updateTask changes status", async () => {
  await resetStore();

  const task = await createTask({ title: "Atualizar", status: "pendente" });
  const updated = await updateTask(task.id, { status: "concluida" });

  assert.equal(updated.status, "concluida");
});

test("getTask returns null for missing id", async () => {
  await resetStore();
  assert.equal(await getTask(999), null);
});

test("deleteTask removes task", async () => {
  await resetStore();

  const task = await createTask({ title: "Remover", status: "pendente" });
  const deleted = await deleteTask(task.id);

  assert.equal(deleted, true);
  const tasks = await listTasks();
  assert.equal(tasks.length, 0);
});