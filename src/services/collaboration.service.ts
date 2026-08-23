import { prisma } from "../config/db";
import { AppError } from "../utils/app-error";
import { get as getTask } from "./task.service";

export async function assign(orgId:string,actorId:string,taskId:string,userId:string){
 await getTask(orgId,taskId);const member=await prisma.orgMember.findUnique({where:{orgId_userId:{orgId,userId}}});if(!member)throw new AppError(403,"FORBIDDEN","Forbidden");
 const recent=await prisma.taskAssignment.findFirst({where:{taskId,userId,assignedAt:{gte:new Date(Date.now()-5000)}}});if(recent)return recent;
 return prisma.$transaction(async tx=>{const assignment=await tx.taskAssignment.upsert({where:{taskId_userId:{taskId,userId}},update:{},create:{taskId,userId}});await tx.activityLog.create({data:{orgId,userId:actorId,entityType:"task",entityId:taskId,action:"TASK_ASSIGNED",metadata:{assigneeId:userId}}});await tx.outboxEvent.create({data:{orgId,type:"TASK_ASSIGNED",payload:{taskId,userId}}});return assignment;});
}
export async function unassign(orgId:string,actorId:string,taskId:string,userId:string){await getTask(orgId,taskId);await prisma.taskAssignment.deleteMany({where:{taskId,userId}});await prisma.activityLog.create({data:{orgId,userId:actorId,entityType:"task",entityId:taskId,action:"TASK_UNASSIGNED",metadata:{assigneeId:userId}}});}
export async function comment(orgId:string,userId:string,taskId:string,body:string){await getTask(orgId,taskId);return prisma.$transaction(async tx=>{const c=await tx.comment.create({data:{taskId,userId,body}});await tx.activityLog.create({data:{orgId,userId,entityType:"task",entityId:taskId,action:"COMMENT_CREATED",metadata:{commentId:c.id}}});return c;});}
export async function comments(orgId:string,taskId:string){await getTask(orgId,taskId);return prisma.comment.findMany({where:{taskId},orderBy:{createdAt:"asc"}});}
