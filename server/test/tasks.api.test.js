import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/index.js";
import { resetStore } from "../src/store.js";
import { resetUsers } from "../src/usersStore.js";

let server;
let baseUrl;
let authToken;

test.before(async () => {
  await resetStore();
  await resetUsers();

  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;

  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Tester", email: "tester@test.com", password: "senha123" })
  });
  const data = await res.json();
  authToken = data.token;
});

test.after(() => {
  server.close();
});

function auth() {
  return { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" };
}

test("GET /api/tasks retorna lista vazia inicialmente", async () => {
  const res = await fetch(`${baseUrl}/api/tasks`, { headers: auth() });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.data, []);
});

test("POST /api/tasks cria tarefa e retorna 201", async () => {
  const res = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({ title: "Nova tarefa", status: "pendente" })
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.data.title, "Nova tarefa");
  assert.equal(body.data.status, "pendente");
  assert.ok(body.data.id);
});

test("GET /api/tasks/:id retorna a tarefa criada", async () => {
  const createRes = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({ title: "Buscar por id", status: "pendente" })
  });
  const { data: created } = await createRes.json();

  const res = await fetch(`${baseUrl}/api/tasks/${created.id}`, { headers: auth() });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.id, created.id);
  assert.equal(body.data.title, "Buscar por id");
});

test("GET /api/tasks/:id retorna 404 para id inexistente", async () => {
  const res = await fetch(`${baseUrl}/api/tasks/99999`, { headers: auth() });
  assert.equal(res.status, 404);
});

test("PUT /api/tasks/:id atualiza titulo e status", async () => {
  const createRes = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({ title: "Antes da edicao", status: "pendente" })
  });
  const { data: created } = await createRes.json();

  const res = await fetch(`${baseUrl}/api/tasks/${created.id}`, {
    method: "PUT",
    headers: auth(),
    body: JSON.stringify({ title: "Depois da edicao", status: "concluida" })
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.title, "Depois da edicao");
  assert.equal(body.data.status, "concluida");
});

test("PUT /api/tasks/:id retorna 404 para id inexistente", async () => {
  const res = await fetch(`${baseUrl}/api/tasks/99999`, {
    method: "PUT",
    headers: auth(),
    body: JSON.stringify({ status: "concluida" })
  });
  assert.equal(res.status, 404);
});

test("DELETE /api/tasks/:id remove a tarefa e retorna 204", async () => {
  const createRes = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({ title: "Para deletar", status: "pendente" })
  });
  const { data: created } = await createRes.json();

  const res = await fetch(`${baseUrl}/api/tasks/${created.id}`, {
    method: "DELETE",
    headers: auth()
  });
  assert.equal(res.status, 204);

  const getRes = await fetch(`${baseUrl}/api/tasks/${created.id}`, { headers: auth() });
  assert.equal(getRes.status, 404);
});

test("DELETE /api/tasks/:id retorna 404 para id inexistente", async () => {
  const res = await fetch(`${baseUrl}/api/tasks/99999`, {
    method: "DELETE",
    headers: auth()
  });
  assert.equal(res.status, 404);
});

test("POST /api/tasks retorna 400 sem titulo", async () => {
  const res = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({ status: "pendente" })
  });
  assert.equal(res.status, 400);
});

test("GET /api/tasks requer autenticacao", async () => {
  const res = await fetch(`${baseUrl}/api/tasks`);
  assert.equal(res.status, 401);
});
