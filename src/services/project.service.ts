import { prisma } from "../config/db";
import { AppError } from "../utils/app-error";

export async function create(orgId: string, userId: string, data: { name: string; description?: string }) {
  return prisma.$transaction(async tx => {
    const project = await tx.project.create({ data: { orgId, ...data } });
    await tx.activityLog.create({ data: { orgId, userId, entityType: "project", entityId: project.id, action: "PROJECT_CREATED" } });
    return project;
  });
}
export const list = (orgId: string) => prisma.project.findMany({ where: { orgId, deletedAt: null }, orderBy: { createdAt: "desc" } });
export async function get(orgId: string, id: string) {
  const project = await prisma.project.findFirst({ where: { id, orgId, deletedAt: null } });
  if (!project) throw new AppError(403, "FORBIDDEN", "Forbidden");
  return project;
}
export async function update(orgId: string, userId: string, id: string, data: { name?: string; description?: string }) {
  await get(orgId, id);
  const project = await prisma.project.update({ where: { id }, data });
  await prisma.activityLog.create({ data: { orgId, userId, entityType: "project", entityId: id, action: "PROJECT_UPDATED" } });
  return project;
}
export async function remove(orgId: string, userId: string, id: string) {
  await get(orgId, id);
  await prisma.$transaction([
    prisma.project.update({ where: { id }, data: { deletedAt: new Date() } }),
    prisma.activityLog.create({ data: { orgId, userId, entityType: "project", entityId: id, action: "PROJECT_DELETED" } })
  ]);
}
