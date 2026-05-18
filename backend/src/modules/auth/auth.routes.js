import { Router } from "express";
import { validate } from "../../common/middleware/validate.js";
import { loginSchema } from "./auth.schema.js";
import { loginController } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", validate(loginSchema), loginController);
