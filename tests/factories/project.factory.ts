/**
 * Project Test Data Factory
 * Sprint 5: Calendar & Gantt Chart
 */

import { prisma } from '@/lib/prisma';

export interface ProjectFactoryData {
  organizationId: string;
  name?: string;
  description?: string;
  status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  color?: string;
  customerId?: string;
}

let projectCounter = 0;

/**
 * Build project data without creating in database
 */
export function buildProject(overrides: ProjectFactoryData) {
  projectCounter++;
  return {
    organizationId: overrides.organizationId,
    name: overrides.name ?? `Test Project ${projectCounter}`,
    description: overrides.description ?? `Description for project ${projectCounter}`,
    status: overrides.status ?? 'active',
    startDate: overrides.startDate ?? new Date(),
    endDate: overrides.endDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
    color: overrides.color ?? '#3B82F6',
    customerId: overrides.customerId,
  };
}

/**
 * Create project in database
 */
export async function createProject(overrides: ProjectFactoryData) {
  const data = buildProject(overrides);

  return prisma.project.create({
    data,
  });
}

/**
 * Create project with tasks
 */
export async function createProjectWithTasks(
  overrides: ProjectFactoryData & { createdById: string },
  taskCount = 3
) {
  const project = await createProject(overrides);

  const tasks = await Promise.all(
    Array.from({ length: taskCount }, (_, i) =>
      prisma.task.create({
        data: {
          organizationId: overrides.organizationId,
          createdById: overrides.createdById,
          projectId: project.id,
          title: `Task ${i + 1}`,
          type: 'task',
          priority: 'medium',
          status: 'pending',
          startDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000), // Weekly offset
          dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
        },
      })
    )
  );

  return { ...project, tasks };
}

/**
 * Reset factory counter
 */
export function resetProjectFactory() {
  projectCounter = 0;
}
