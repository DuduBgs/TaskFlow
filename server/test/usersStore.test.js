import test from "node:test";
import assert from "node:assert/strict";
import { createUser, getUserByEmail, resetUsers } from "../src/usersStore.js";

test("createUser stores and returns user", async () => {
  await resetUsers();

  const user = await createUser({
    name: "Joao",
    email: "joao@example.com",
    passwordHash: "hash"
  });

  assert.equal(user.id, 1);
  assert.equal(user.email, "joao@example.com");
});

test("getUserByEmail returns user", async () => {
  await resetUsers();

  await createUser({
    name: "Maria",
    email: "maria@example.com",
    passwordHash: "hash"
  });

  const user = await getUserByEmail("MARIA@example.com");
  assert.equal(user.name, "Maria");
});