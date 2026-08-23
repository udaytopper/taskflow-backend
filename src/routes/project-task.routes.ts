import { Router } from "express";
import { z } from "zod";
import { TaskPriority } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import * as tasks from "../services/task.service";

export const projectTaskRouter=Router({mergeParams:true});projectTaskRouter.use(authenticate);
const schema=z.object({title:z.string().min(1).max(200),description:z.string().max(5000).optional(),priority:z.nativeEnum(TaskPriority).optional(),dueDate:z.coerce.date().optional()});
projectTaskRouter.post("/",async(req,res,next)=>{try{res.status(201).json(await tasks.create(req.auth!.orgId,req.auth!.userId,req.params.projectId,schema.parse(req.body)));}catch(e){next(e);}});
