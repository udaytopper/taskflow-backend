import "dotenv/config";
import { createApp } from "./app";

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

const server = app.listen(port, () => {
  console.log(`TaskFlow API listening on port ${port}`);
});

const shutdown = (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully.`);
  server.close(() => process.exit(0));
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
