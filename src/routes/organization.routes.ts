import { Router } from "express";
import { OrgRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/db";
import { authenticate,requireRole } from "../middleware/auth";
import { AppError } from "../utils/app-error";

export const organizationRouter=Router();organizationRouter.use(authenticate);
organizationRouter.get("/current",async(req,res,next)=>{try{const org=await prisma.organization.findUnique({where:{id:req.auth!.orgId},include:{members:{include:{user:{select:{id:true,name:true,email:true}}}}}});res.json(org);}catch(e){next(e);}});
organizationRouter.patch("/current",requireRole(OrgRole.ORG_ADMIN),async(req,res,next)=>{try{const {name}=z.object({name:z.string().min(1).max(120)}).parse(req.body);res.json(await prisma.organization.update({where:{id:req.auth!.orgId},data:{name}}));}catch(e){next(e);}});
organizationRouter.post("/current/members",requireRole(OrgRole.ORG_ADMIN),async(req,res,next)=>{try{const v=z.object({email:z.email(),role:z.nativeEnum(OrgRole).default(OrgRole.MEMBER)}).parse(req.body);const user=await prisma.user.findUnique({where:{email:v.email.toLowerCase()}});if(!user)throw new AppError(404,"USER_NOT_FOUND","User not found");const member=await prisma.orgMember.upsert({where:{orgId_userId:{orgId:req.auth!.orgId,userId:user.id}},update:{role:v.role},create:{orgId:req.auth!.orgId,userId:user.id,role:v.role}});res.status(201).json(member);}catch(e){next(e);}});
organizationRouter.delete("/current/members/:userId",requireRole(OrgRole.ORG_ADMIN),async(req,res,next)=>{try{if(req.params.userId===req.auth!.userId)throw new AppError(400,"CANNOT_REMOVE_SELF","Admin cannot remove their own active membership");await prisma.orgMember.deleteMany({where:{orgId:req.auth!.orgId,userId:req.params.userId}});res.status(204).send();}catch(e){next(e);}});
