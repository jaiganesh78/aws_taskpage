'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { TaskService } from '@/lib/services';
import type { Category, Priority, TaskStatus } from '@prisma/client';

export async function createTask(formData: FormData) {
  const name = formData.get('name') as string;
  const category = formData.get('category') as Category;
  const priority = formData.get('priority') as Priority;
  const status = (formData.get('status') as TaskStatus) ?? 'NOT_ASSIGNED';
  const startDate = formData.get('startDate') as string | null;
  const dueDate = new Date(formData.get('dueDate') as string);
  const notes = formData.get('notes') as string | null;
  const createdById = formData.get('createdById') as string;
  const assignedToId = formData.get('assignedToId') as string | null;

  if (!name || !dueDate || !createdById) {
    return { error: 'Missing required fields' };
  }

  const task = await TaskService.create({
    name,
    category,
    priority,
    status,
    startDate: startDate ? new Date(startDate) : undefined,
    dueDate,
    notes: notes ?? undefined,
    createdById,
    assignedToId: assignedToId ?? undefined,
  });

  revalidatePath('/');
  revalidatePath('/crew');
  return { success: true, task };
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const task = await TaskService.updateStatus(taskId, status);
  revalidatePath('/');
  revalidatePath('/crew');
  return { success: true, task };
}

export async function updateTaskProgress(taskId: string, progress: number) {
  const task = await TaskService.updateProgress(taskId, progress);
  revalidatePath('/');
  revalidatePath('/crew');
  return { success: true, task };
}

export async function addComment(formData: FormData) {
  const taskId = formData.get('taskId') as string;
  const userId = formData.get('userId') as string;
  const message = formData.get('message') as string;

  if (!taskId || !userId || !message) {
    return { error: 'Missing required fields' };
  }

  const comment = await TaskService.addComment(taskId, userId, message);
  revalidatePath('/');
  revalidatePath('/crew');
  return { success: true, comment };
}

export async function deleteTask(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath('/');
  revalidatePath('/crew');
  return { success: true };
}
