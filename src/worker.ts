import "dotenv/config";
import { Worker } from "bullmq";
import { redis } from "./config/queue";
import { publishOutboxBatch } from "./jobs/outbox.publisher";
import { prisma } from "./config/db";

const worker=new Worker("notifications",async job=>{
 const {taskId,userId}=job.data as {taskId:string;userId:string};
 const [task,user]=await Promise.all([prisma.task.findUnique({where:{id:taskId}}),prisma.user.findUnique({where:{id:userId}})]);
 if(!task||!user)throw new Error("Notification target no longer exists");
 console.log(`[notification] task '${task.title}' assigned to ${user.email}`);
},{connection:redis});

const timer=setInterval(()=>publishOutboxBatch().catch(console.error),1000);
async function shutdown(){clearInterval(timer);await worker.close();await redis.quit();await prisma.$disconnect();process.exit(0);}
process.on("SIGTERM",shutdown);process.on("SIGINT",shutdown);
