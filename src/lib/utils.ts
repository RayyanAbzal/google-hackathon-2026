import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: 'Passport',
  driving_licence: "Driver's Licence",
  degree: 'Degree Certificate',
  employer_letter: 'Employer Letter',
  nhs_card: 'NHS Card',
}

export function formatDocType(value?: string | null): string {
  if (!value) return '—'
  return DOC_TYPE_LABELS[value] ?? value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
