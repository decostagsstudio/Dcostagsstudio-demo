import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { comparePassword } from "../../common/utils/password.js";
import { findUserByEmail, recordFailedLogin, resetLoginSecurityState } from "./auth.repository.js";

export async function login(email, password) {
  const user = await findUserByEmail(email);
  if (!user || !user.is_active) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }
  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    const error = new Error("Account temporarily locked");
    error.statusCode = 423;
    throw error;
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    await recordFailedLogin(user.id);
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }
  await resetLoginSecurityState(user.id);

  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
