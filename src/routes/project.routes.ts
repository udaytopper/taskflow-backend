import { Router } from "express";
import { OrgRole } from "@prisma/client";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth";
import * as projects from "../services/project.service";

export const projectRouter = Router();
projectRouter.use(authenticate);
const body = z.object({ name: z.string().min(1).max(120), description: z.string().max(2000).optional() });
projectRouter.post("/", async (req,res,next)=>{try{res.status(201).json(await projects.create(req.auth!.orgId,req.auth!.userId,body.parse(req.body)));}catch(e){next(e);}});
projectRouter.get("/", async(req,res,next)=>{try{res.json(await projects.list(req.auth!.orgId));}catch(e){next(e);}});
projectRouter.get("/:id", async(req,res,next)=>{try{res.json(await projects.get(req.auth!.orgId,req.params.id));}catch(e){next(e);}});
projectRouter.patch("/:id", async(req,res,next)=>{try{res.json(await projects.update(req.auth!.orgId,req.auth!.userId,req.params.id,body.partial().parse(req.body)));}catch(e){next(e);}});
projectRouter.delete("/:id", requireRole(OrgRole.ORG_ADMIN), async(req,res,next)=>{try{await projects.remove(req.auth!.orgId,req.auth!.userId,req.params.id);res.status(204).send();}catch(e){next(e);}});
