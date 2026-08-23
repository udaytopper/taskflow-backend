import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OrgRole } from "@prisma/client";
import { AppError } from "../utils/app-error";

type Claims = { sub: string; orgId: string; role: OrgRole };

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
  try {
    const claims = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as Claims;
    req.auth = { userId: claims.sub, orgId: claims.orgId, role: claims.role };
    next();
  } catch {
    next(new AppError(401, "INVALID_TOKEN", "Invalid or expired access token"));
  }
}

export const requireRole = (...roles: OrgRole[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.auth || !roles.includes(req.auth.role)) return next(new AppError(403, "FORBIDDEN", "Forbidden"));
  next();
};
