import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient();
async function main(){const passwordHash=await bcrypt.hash("TaskFlow123!",12);for(let o=1;o<=2;o++){const org=await prisma.organization.create({data:{name:`Demo Organization ${o}`}});for(let u=1;u<=3;u++){const user=await prisma.user.create({data:{email:`demo${o}${u}@taskflow.local`,name:`Demo ${o}-${u}`,passwordHash}});await prisma.orgMember.create({data:{orgId:org.id,userId:user.id,role:u===1?"ORG_ADMIN":"MEMBER"}});}for(let p=1;p<=2;p++){const project=await prisma.project.create({data:{orgId:org.id,name:`Project ${o}-${p}`}});for(let t=1;t<=5;t++)await prisma.task.create({data:{orgId:org.id,projectId:project.id,title:`Task ${o}-${p}-${t}`,priority:t%2?"HIGH":"MEDIUM",status:t%4===0?"DONE":"TODO"}});}}}
main().finally(()=>prisma.$disconnect());
