import jwt from "jsonwebtoken";
import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/config/db";

const enabled=process.env.RUN_INTEGRATION_TESTS==="true";
(enabled?describe:describe.skip)("cross-tenant isolation",()=>{const app=createApp();let orgA:string,orgB:string,userA:string,projectB:string,taskB:string,tokenA:string;
beforeAll(async()=>{process.env.JWT_ACCESS_SECRET=process.env.JWT_ACCESS_SECRET||"integration-secret";const a=await prisma.organization.create({data:{name:"Tenant A"}});const b=await prisma.organization.create({data:{name:"Tenant B"}});orgA=a.id;orgB=b.id;const u=await prisma.user.create({data:{email:`a-${Date.now()}@test.local`,name:"A",passwordHash:"x"}});userA=u.id;await prisma.orgMember.create({data:{orgId:orgA,userId:userA,role:"ORG_ADMIN"}});const p=await prisma.project.create({data:{orgId:orgB,name:"Secret B"}});projectB=p.id;const t=await prisma.task.create({data:{orgId:orgB,projectId:p.id,title:"Secret Task B"}});taskB=t.id;tokenA=jwt.sign({orgId:orgA,role:"ORG_ADMIN"},process.env.JWT_ACCESS_SECRET!,{subject:userA});});
afterAll(async()=>{if(orgA)await prisma.organization.deleteMany({where:{id:{in:[orgA,orgB]}}});if(userA)await prisma.user.deleteMany({where:{id:userA}});await prisma.$disconnect();});
it("returns 403 without leaking project data",async()=>{const r=await request(app).get(`/projects/${projectB}`).set("Authorization",`Bearer ${tokenA}`);expect(r.status).toBe(403);expect(JSON.stringify(r.body)).not.toContain("Secret B");});
it("blocks cross-tenant task access",async()=>{const r=await request(app).get(`/tasks/${taskB}`).set("Authorization",`Bearer ${tokenA}`);expect(r.status).toBe(403);expect(JSON.stringify(r.body)).not.toContain("Secret Task B");});
it("does not trust client supplied orgId",async()=>{const r=await request(app).post("/projects").set("Authorization",`Bearer ${tokenA}`).send({name:"Injected",orgId:orgB});expect(r.status).toBe(201);const created=await prisma.project.findUnique({where:{id:r.body.id}});expect(created?.orgId).toBe(orgA);});});
