import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function homePathForRole(role: 'admin' | 'technician' | 'client'): string {
  if (role === 'admin') return '/admin/interventions'
  if (role === 'technician') return '/technician/agenda'
  return '/profil'
}
