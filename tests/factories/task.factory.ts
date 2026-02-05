/**
 * Task Test Data Factory
 * Sprint 5: Calendar & Gantt Chart
 */

import { prisma } from '@/lib/prisma';

export type TaskType = 'task' | 'call' | 'meeting' | 'email' | 'follow_up' | 'milestone';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface TaskFactoryData {
  organizationId: string;
  createdById: string;
  title?: string;
  description?: string;
  type?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  startDate?: Date;
  dueDate?: Date;
  dueTime?: string;
  isAllDay?: boolean;
  progress?: number;
  assignedToId?: string;
  projectId?: string;
  customerId?: string;
  dealId?: string;
  contactId?: string;
}

let taskCounter = 0;

/**
 * Build task data without creating in database
 */
export function buildTask(overrides: TaskFactoryData) {
  taskCounter++;
  return {
    organizationId: overrides.organizationId,
    createdById: overrides.createdById,
    title: overrides.title ?? `Test Task ${taskCounter}`,
    description: overrides.description ?? `Description for task ${taskCounter}`,
    type: overrides.type ?? 'task',
    priority: overrides.priority ?? 'medium',
    status: overrides.status ?? 'pending',
    startDate: overrides.startDate ?? new Date(),
    dueDate: overrides.dueDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
    dueTime: overrides.dueTime,
    isAllDay: overrides.isAllDay ?? false,
    progress: overrides.progress ?? 0,
    assignedToId: overrides.assignedToId ?? overrides.createdById,
    projectId: overrides.projectId,
    customerId: overrides.customerId,
    dealId: overrides.dealId,
    contactId: overrides.contactId,
  };
}

/**
 * Create task in database
 */
export async function createTask(overrides: TaskFactoryData) {
  const data = buildTask(overrides);

  return prisma.task.create({
    data,
  });
}

/**
 * Create task with dependencies
 */
export async function createTaskWithDependencies(
  overrides: TaskFactoryData,
  prerequisiteCount = 2
) {
  // Create prerequisite tasks first
  const prerequisites = await Promise.all(
    Array.from({ length: prerequisiteCount }, (_, i) =>
      createTask({
        ...overrides,
        title: `Prerequisite Task ${i + 1}`,
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      })
    )
  );

  // Create the main task
  const task = await createTask(overrides);

  // Create dependencies
  const dependencies = await Promise.all(
    prerequisites.map((prereq) =>
      prisma.taskDependency.create({
        data: {
          prerequisiteId: prereq.id,
          dependentId: task.id,
          type: 'finish_to_start',
        },
      })
    )
  );

  return { ...task, prerequisites, dependencies };
}

/**
 * Create multiple tasks for calendar view testing
 */
export async function createTasksForCalendar(
  overrides: TaskFactoryData,
  count = 5
) {
  const tasks = await Promise.all(
    Array.from({ length: count }, (_, i) => {
      const daysOffset = i * 2; // Every 2 days
      return createTask({
        ...overrides,
        title: `Calendar Task ${i + 1}`,
        type: ['task', 'call', 'meeting', 'email', 'follow_up'][i % 5] as TaskType,
        startDate: new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + (daysOffset + 1) * 24 * 60 * 60 * 1000),
      });
    })
  );

  return tasks;
}

/**
 * Create tasks for gantt chart testing
 */
export async function createTasksForGantt(
  overrides: TaskFactoryData,
  count = 5
) {
  const tasks: Awaited<ReturnType<typeof createTask>>[] = [];

  for (let i = 0; i < count; i++) {
    const task = await createTask({
      ...overrides,
      title: `Gantt Task ${i + 1}`,
      priority: ['low', 'medium', 'high', 'urgent'][i % 4] as TaskPriority,
      startDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000), // Weekly intervals
      dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
      progress: i * 20, // 0, 20, 40, 60, 80
    });
    tasks.push(task);
  }

  // Create sequential dependencies (task 2 depends on task 1, etc.)
  for (let i = 1; i < tasks.length; i++) {
    await prisma.taskDependency.create({
      data: {
        prerequisiteId: tasks[i - 1].id,
        dependentId: tasks[i].id,
        type: 'finish_to_start',
      },
    });
  }

  return tasks;
}

/**
 * Reset factory counter
 */
export function resetTaskFactory() {
  taskCounter = 0;
}
