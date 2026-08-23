import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { notificationQueue } from "../config/queue";
import { prisma } from "../config/db";
import { AppError } from "../utils/app-error";

export const jobRouter=Router();jobRouter.use(authenticate);
jobRouter.get("/:id",async(req,res,next)=>{try{const event=await prisma.outboxEvent.findFirst({where:{id:req.params.id,orgId:req.auth!.orgId}});if(!event)throw new AppError(403,"FORBIDDEN","Forbidden");const job=await notificationQueue.getJob(req.params.id);const state=job?await job.getState():event.status.toLowerCase();res.json({id:event.id,state,attempts:job?.attemptsMade??event.attempts,failedReason:job?.failedReason??null});}catch(e){next(e);}});
