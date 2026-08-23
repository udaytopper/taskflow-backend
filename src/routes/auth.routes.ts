import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import * as auth from "../services/auth.service";

export const authRouter = Router();
const limiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });
authRouter.use(limiter);

const registerSchema = z.object({ email: z.email(), password: z.string().min(8), name: z.string().min(1), organizationName: z.string().min(1) });
const loginSchema = z.object({ email: z.email(), password: z.string().min(1), orgId: z.string().uuid().optional() });

authRouter.post("/register", async (req, res, next) => { try { res.status(201).json(await auth.register(registerSchema.parse(req.body))); } catch (e) { next(e); } });
authRouter.post("/login", async (req, res, next) => { try { const v = loginSchema.parse(req.body); res.json(await auth.login(v.email, v.password, v.orgId)); } catch (e) { next(e); } });
authRouter.post("/refresh", async (req, res, next) => { try { const v = z.object({ refreshToken: z.string(), orgId: z.string().uuid() }).parse(req.body); res.json(await auth.refresh(v.refreshToken, v.orgId)); } catch (e) { next(e); } });
authRouter.post("/logout", async (req, res, next) => { try { const v = z.object({ refreshToken: z.string() }).parse(req.body); await auth.logout(v.refreshToken); res.status(204).send(); } catch (e) { next(e); } });
