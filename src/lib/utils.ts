import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateLeadScore(interactions: any[], lead: any): number {
  let score = 0;
  
  // Base score from budget
  if (lead.estimatedBudget) {
    if (lead.estimatedBudget > 5000) score += 40;
    else if (lead.estimatedBudget > 1000) score += 20;
  }

  // Interest level
  if (lead.interestLevel === 'High') score += 30;
  else if (lead.interestLevel === 'Medium') score += 15;

  // Interaction count
  const interCount = interactions.filter(i => i.leadId === lead.id).length;
  score += Math.min(interCount * 5, 20);

  // Cap score at 100
  return Math.min(score, 100);
}

export function generateReferralCode(name: string): string {
  const prefix = name.substring(0, 3).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${random}`;
}

export function base64ToBlob(base64: string, type: string = 'image/png'): Blob {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type });
}
