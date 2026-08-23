import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "healthy", service: "taskflow-api" });
  });

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found", code: "ROUTE_NOT_FOUND", details: {} });
  });

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR", details: {} });
  });

  return app;
};
