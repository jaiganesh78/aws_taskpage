'use server';

import { revalidatePath } from 'next/cache';
import { CrewService } from '@/lib/services';

export async function addCrew(formData: FormData) {
  const name = formData.get('name') as string;
  const email = (formData.get('email') as string) ?? null;

  if (!name) return { error: 'Name required' };

  const crew = await CrewService.create({ name, email });
  revalidatePath('/');
  return { success: true, crew };
}

export async function editCrew(formData: FormData) {
  const id = formData.get('id') as string;
  const name = (formData.get('name') as string) ?? undefined;
  const email = (formData.get('email') as string) ?? null;
  const department = (formData.get('department') as string) ?? null;

  const crew = await CrewService.update(id, { name, email, department });
  revalidatePath('/');
  return { success: true, crew };
}

export async function removeCrew(formData: FormData) {
  const id = formData.get('id') as string;
  await CrewService.delete(id);
  revalidatePath('/');
  return { success: true };
}
