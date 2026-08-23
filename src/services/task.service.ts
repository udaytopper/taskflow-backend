import { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../utils/app-error";

export async function create(orgId:string,userId:string,projectId:string,data:{title:string;description?:string;priority?:TaskPriority;dueDate?:Date}){
 const project=await prisma.project.findFirst({where:{id:projectId,orgId,deletedAt:null}}); if(!project) throw new AppError(403,"FORBIDDEN","Forbidden");
 return prisma.$transaction(async tx=>{const task=await tx.task.create({data:{orgId,projectId,...data}});await tx.activityLog.create({data:{orgId,userId,entityType:"task",entityId:task.id,action:"TASK_CREATED"}});return task;});
}
export async function get(orgId:string,id:string){const task=await prisma.task.findFirst({where:{id,orgId,deletedAt:null},include:{assignments:true}});if(!task)throw new AppError(403,"FORBIDDEN","Forbidden");return task;}
export async function list(orgId:string,q:{status?:TaskStatus;priority?:TaskPriority;assignee?:string;cursor?:string;limit?:number}){
 const take=Math.min(q.limit??20,100);const where:Prisma.TaskWhereInput={orgId,deletedAt:null,status:q.status,priority:q.priority,assignments:q.assignee?{some:{userId:q.assignee}}:undefined};
 const rows=await prisma.task.findMany({where,take:take+1,cursor:q.cursor?{id:q.cursor}:undefined,skip:q.cursor?1:0,orderBy:{id:"asc"}});const hasMore=rows.length>take;const data=hasMore?rows.slice(0,take):rows;return{data,nextCursor:hasMore?data[data.length-1].id:null};
}
export async function update(orgId:string,userId:string,id:string,data:{title?:string;description?:string;status?:TaskStatus;priority?:TaskPriority;dueDate?:Date|null}){const old=await get(orgId,id);const task=await prisma.task.update({where:{id},data});await prisma.activityLog.create({data:{orgId,userId,entityType:"task",entityId:id,action:old.status!==task.status?"STATUS_CHANGED":"TASK_UPDATED",metadata:{fromStatus:old.status,toStatus:task.status}}});return task;}
export async function remove(orgId:string,userId:string,id:string){await get(orgId,id);await prisma.$transaction([prisma.task.update({where:{id},data:{deletedAt:new Date()}}),prisma.activityLog.create({data:{orgId,userId,entityType:"task",entityId:id,action:"TASK_DELETED"}})]);}
export async function timeline(orgId:string,id:string){await get(orgId,id);return prisma.activityLog.findMany({where:{orgId,entityType:"task",entityId:id},orderBy:{createdAt:"asc"}});}
export async function search(orgId:string,query:string){return prisma.$queryRaw<Array<Record<string,unknown>>>(Prisma.sql`SELECT id,title,description,status,priority,due_date FROM tasks WHERE org_id=${orgId} AND deleted_at IS NULL AND to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')) @@ websearch_to_tsquery('english', ${query}) ORDER BY ts_rank(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')), websearch_to_tsquery('english', ${query})) DESC LIMIT 50`);}
