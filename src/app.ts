import cors from "cors";
import express,{NextFunction,Request,Response} from "express";
import helmet from "helmet";
import { ZodError } from "zod";
import { authRouter } from "./routes/auth.routes";
import { organizationRouter } from "./routes/organization.routes";
import { projectRouter } from "./routes/project.routes";
import { taskRouter } from "./routes/task.routes";
import { projectTaskRouter } from "./routes/project-task.routes";
import { jobRouter } from "./routes/job.routes";
import { AppError } from "./utils/app-error";

export const createApp=()=>{const app=express();app.disable("x-powered-by");app.use(helmet());app.use(cors());app.use(express.json({limit:"1mb"}));
app.get("/health",(_req,res)=>res.status(200).json({status:"healthy",service:"taskflow-api"}));
app.use("/auth",authRouter);app.use("/organizations",organizationRouter);app.use("/projects",projectRouter);app.use("/projects/:projectId/tasks",projectTaskRouter);app.use("/tasks",taskRouter);app.use("/jobs",jobRouter);
app.use((_req:Request,res:Response)=>res.status(404).json({error:"Route not found",code:"ROUTE_NOT_FOUND",details:{}}));
app.use((error:unknown,_req:Request,res:Response,_next:NextFunction)=>{if(error instanceof ZodError)return res.status(400).json({error:"Validation failed",code:"VALIDATION_ERROR",details:error.flatten()});if(error instanceof AppError)return res.status(error.status).json({error:error.message,code:error.code,details:error.details});console.error(error);return res.status(500).json({error:"Internal server error",code:"INTERNAL_ERROR",details:{}});});return app;};
