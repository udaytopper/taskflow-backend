import { OrgRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; orgId: string; role: OrgRole };
    }
  }
}
export {};
