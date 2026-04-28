import { Router } from "express";
import bcrypt from "bcryptjs";
import { createToken, requireAuth } from "../middleware/auth.js";
import { createUser, getUserByEmail, getUserById } from "../usersStore.js";

const router = Router();

function sanitizeUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email and password are required" });
    return;
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: "email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = await createUser({ name, email, passwordHash });
  const token = createToken({ sub: user.id, email: user.email });

  res.status(201).json({ data: sanitizeUser(user), token });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const user = await getUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: "invalid credentials" });
    return;
  }

  const isValid = await bcrypt.compare(String(password), user.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: "invalid credentials" });
    return;
  }

  const token = createToken({ sub: user.id, email: user.email });
  res.json({ data: sanitizeUser(user), token });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await getUserById(req.user.sub);
  if (!user) {
    res.status(404).json({ error: "user not found" });
    return;
  }

  res.json({ data: sanitizeUser(user) });
});

export default router;