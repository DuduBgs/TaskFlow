import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

export const hasDatabase = Boolean(databaseUrl);
export const pool = hasDatabase ? new Pool({ connectionString: databaseUrl }) : null;