import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";
import { AppError } from "../utils/app-error";

const hash = (v: string) => crypto.createHash("sha256").update(v).digest("hex");

function signAccess(userId: string, orgId: string, role: string) {
  return jwt.sign({ orgId, role }, process.env.JWT_ACCESS_SECRET!, { subject: userId, expiresIn: "15m" });
}
function signRefresh(userId: string) {
  return jwt.sign({}, process.env.JWT_REFRESH_SECRET!, { subject: userId, expiresIn: "7d" });
}

export async function register(input: { email: string; password: string; name: string; organizationName: string }) {
  if (input.password.length < 8) throw new AppError(400, "WEAK_PASSWORD", "Password must contain at least 8 characters");
  const passwordHash = await bcrypt.hash(input.password, 12);
  return prisma.$transaction(async tx => {
    const user = await tx.user.create({ data: { email: input.email.toLowerCase(), name: input.name, passwordHash } });
    const org = await tx.organization.create({ data: { name: input.organizationName } });
    const member = await tx.orgMember.create({ data: { userId: user.id, orgId: org.id, role: "ORG_ADMIN" } });
    return issueTokens(tx, user.id, org.id, member.role);
  });
}

async function issueTokens(tx: any, userId: string, orgId: string, role: string) {
  const accessToken = signAccess(userId, orgId, role);
  const refreshToken = signRefresh(userId);
  await tx.refreshToken.create({ data: { userId, tokenHash: hash(refreshToken), expiresAt: new Date(Date.now() + 7 * 86400000) } });
  return { accessToken, refreshToken };
}

export async function login(email: string, password: string, orgId?: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { memberships: true } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
  const membership = orgId ? user.memberships.find(m => m.orgId === orgId) : user.memberships[0];
  if (!membership) throw new AppError(403, "FORBIDDEN", "Forbidden");
  return issueTokens(prisma, user.id, membership.orgId, membership.role);
}

export async function refresh(token: string, orgId: string) {
  let claims: jwt.JwtPayload;
  try { claims = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as jwt.JwtPayload; } catch { throw new AppError(401, "INVALID_REFRESH_TOKEN", "Invalid refresh token"); }
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hash(token) } });
  if (!stored || stored.revokedAt || stored.expiresAt <= new Date() || stored.userId !== claims.sub) throw new AppError(401, "INVALID_REFRESH_TOKEN", "Invalid refresh token");
  const membership = await prisma.orgMember.findUnique({ where: { orgId_userId: { orgId, userId: stored.userId } } });
  if (!membership) throw new AppError(403, "FORBIDDEN", "Forbidden");
  return prisma.$transaction(async tx => {
    await tx.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return issueTokens(tx, stored.userId, orgId, membership.role);
  });
}

export async function logout(token: string) {
  await prisma.refreshToken.updateMany({ where: { tokenHash: hash(token), revokedAt: null }, data: { revokedAt: new Date() } });
}
