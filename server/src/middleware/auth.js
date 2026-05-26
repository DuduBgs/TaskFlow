import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const jwtSecret = process.env.JWT_SECRET;

export function createToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: "7d" });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");

  if (!token) {
    res.status(401).json({ error: "missing token" });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "invalid token" });
  }
}