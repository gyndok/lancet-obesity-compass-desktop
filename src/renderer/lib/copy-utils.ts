import { toast } from 'sonner';
import type { Visit } from '@/types/visit';
import type { Response } from '@/types/interview';
import { initialVisitQuestions } from '@/data/initialVisitQuestions';

export async function copyToClipboard(text: string, label?: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label ? `${label} copied` : 'Copied to clipboard');
  } catch {
    toast.error('Failed to copy to clipboard');
  }
}

export function formatVisitSummary(visit: Visit): string {
  const responses: Response[] = JSON.parse(visit.responses || '[]');
  const lines: string[] = [];
  lines.push('=== INITIAL VISIT SUMMARY ===');
  lines.push(`Date: ${new Date(visit.created_at).toLocaleDateString()}`);
  if (visit.patient_label) lines.push(`Patient: ${visit.patient_label}`);
  lines.push('');

  if (visit.bmi) {
    lines.push('--- BMI Data ---');
    if (visit.height_feet != null && visit.height_inches != null)
      lines.push(`Height: ${visit.height_feet}'${visit.height_inches}"`);
    if (visit.weight_lbs) lines.push(`Weight: ${visit.weight_lbs} lbs`);
    lines.push(`BMI: ${visit.bmi.toFixed(1)}`);
    lines.push('');
  }

  let currentSection = '';
  for (const resp of responses) {
    const question = initialVisitQuestions.find((q) => q.id === resp.questionId);
    if (!question) continue;
    if (question.section !== currentSection) {
      currentSection = question.section;
      lines.push(`--- ${currentSection} ---`);
    }
    const answer = Array.isArray(resp.answer)
      ? resp.answer.join(', ')
      : String(resp.answer);
    lines.push(`${question.question}: ${answer}`);
  }

  if (visit.assessment) {
    const assessment = JSON.parse(visit.assessment);
    lines.push('');
    lines.push('--- Diagnostic Assessment ---');
    lines.push(`Classification: ${assessment.classification}`);
    lines.push(`Confidence: ${assessment.confidence}`);
    if (assessment.affectedSystems?.length)
      lines.push(`Affected Systems: ${assessment.affectedSystems.join(', ')}`);
    if (assessment.recommendations?.length)
      lines.push(`Recommendations: ${assessment.recommendations.join('; ')}`);
  }

  if (visit.elapsed_time)
    lines.push(
      `\nEncounter Duration: ${Math.round(visit.elapsed_time / 60)} minutes`,
    );

  return lines.join('\n');
}

export function formatSection(sectionName: string, visit: Visit): string {
  const responses: Response[] = JSON.parse(visit.responses || '[]');
  const lines: string[] = [`--- ${sectionName} ---`];
  for (const resp of responses) {
    const question = initialVisitQuestions.find((q) => q.id === resp.questionId);
    if (!question || question.section !== sectionName) continue;
    const answer = Array.isArray(resp.answer)
      ? resp.answer.join(', ')
      : String(resp.answer);
    lines.push(`${question.question}: ${answer}`);
  }
  return lines.join('\n');
}
