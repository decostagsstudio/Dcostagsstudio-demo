import { db } from "../../config/database.js";

export async function findUserByEmail(email) {
  const result = await db.query(
    `SELECT id, name, email, role, password_hash, is_active, failed_attempts, locked_until
     FROM admin_users
     WHERE email = $1`,
    [email],
  );
  return result.rows[0] || null;
}

export async function recordFailedLogin(userId) {
  const result = await db.query(
    `UPDATE admin_users
       SET failed_attempts = CASE
             WHEN COALESCE(failed_attempts, 0) + 1 >= 5 THEN 0
             ELSE COALESCE(failed_attempts, 0) + 1
           END,
           locked_until = CASE
             WHEN COALESCE(failed_attempts, 0) + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
             ELSE locked_until
           END,
           updated_at = NOW()
     WHERE id = $1
     RETURNING failed_attempts, locked_until`,
    [userId],
  );
  return result.rows[0] || null;
}

export async function resetLoginSecurityState(userId) {
  await db.query(
    `UPDATE admin_users
       SET failed_attempts = 0,
           locked_until = NULL,
           updated_at = NOW()
     WHERE id = $1`,
    [userId],
  );
}
