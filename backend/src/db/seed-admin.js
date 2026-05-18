import { db } from "../config/database.js";
import { hashPassword } from "../common/utils/password.js";

async function run() {
  const email = process.env.SEED_DIRECTOR_EMAIL || "director@dcostagsstudio.com";
  const password = process.env.SEED_DIRECTOR_PASSWORD || "Director#2026";
  const name = process.env.SEED_DIRECTOR_NAME || "Dirección";

  const hash = await hashPassword(password);

  await db.query(
    `INSERT INTO admin_users(name, email, role, password_hash, is_active)
     VALUES ($1, $2, 'director', $3, TRUE)
     ON CONFLICT (email)
     DO UPDATE SET
       name = EXCLUDED.name,
       role = EXCLUDED.role,
       password_hash = EXCLUDED.password_hash,
       is_active = TRUE,
       updated_at = NOW()`,
    [name, email, hash],
  );

  console.log(`Director user ready: ${email}`);
}

run()
  .then(async () => {
    await db.end();
  })
  .catch(async (error) => {
    console.error(error);
    await db.end();
    process.exit(1);
  });
