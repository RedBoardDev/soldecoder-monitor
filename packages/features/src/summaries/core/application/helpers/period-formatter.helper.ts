import type { SummaryType } from '../../domain/types/summary.types';

export function formatPeriodForDisplay(summaryType: SummaryType): string {
  const now = new Date();

  if (summaryType === 'weekly') {
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);

    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else {
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1);

    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
}
