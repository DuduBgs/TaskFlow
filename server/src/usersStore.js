import { hasDatabase, pool } from "./db.js";

let nextUserId = 1;
const users = [];

function mapRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash ?? row.passwordHash
  };
}

export async function createUser({ name, email, passwordHash }) {
  if (!name || !email || !passwordHash) {
    throw new Error("name, email and passwordHash are required");
  }

  if (!hasDatabase) {
    const user = {
      id: nextUserId++,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      passwordHash: String(passwordHash)
    };
    users.push(user);
    return { ...user };
  }

  const result = await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, password_hash",
    [String(name).trim(), String(email).trim().toLowerCase(), String(passwordHash)]
  );

  return mapRow(result.rows[0]);
}

export async function getUserByEmail(email) {
  if (!email) {
    return null;
  }

  const normalized = String(email).trim().toLowerCase();

  if (!hasDatabase) {
    const user = users.find((item) => item.email === normalized);
    return user ? { ...user } : null;
  }

  const result = await pool.query(
    "SELECT id, name, email, password_hash FROM users WHERE email = $1",
    [normalized]
  );

  return mapRow(result.rows[0]);
}

export async function getUserById(id) {
  const userId = Number(id);

  if (!hasDatabase) {
    const user = users.find((item) => item.id === userId);
    return user ? { ...user } : null;
  }

  const result = await pool.query(
    "SELECT id, name, email, password_hash FROM users WHERE id = $1",
    [userId]
  );

  return mapRow(result.rows[0]);
}

export async function resetUsers() {
  if (!hasDatabase) {
    users.length = 0;
    nextUserId = 1;
    return;
  }

  await pool.query("DELETE FROM users");
}