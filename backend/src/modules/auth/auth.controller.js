import { login } from "./auth.service.js";

export async function loginController(req, res, next) {
  try {
    const { email, password } = req.body;
    const payload = await login(email, password);
    res.json(payload);
  } catch (error) {
    next(error);
  }
}
