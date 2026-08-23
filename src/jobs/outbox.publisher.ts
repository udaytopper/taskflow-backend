import { prisma } from "../config/db";
import { notificationQueue } from "../config/queue";

export async function publishOutboxBatch(){
 const events=await prisma.outboxEvent.findMany({where:{status:"PENDING"},orderBy:{createdAt:"asc"},take:50});
 for(const event of events){try{await notificationQueue.add(event.type,event.payload as object,{jobId:event.id,attempts:4,backoff:{type:"exponential",delay:1000},removeOnComplete:100,removeOnFail:false});await prisma.outboxEvent.update({where:{id:event.id},data:{status:"PUBLISHED",publishedAt:new Date()}});}catch{await prisma.outboxEvent.update({where:{id:event.id},data:{attempts:{increment:1}}});}}
}
