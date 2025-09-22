// lib/analysis-service.ts

export function calculatePulseIndex(momentum: number, sentiment: number): number {
  const normMomentum = Math.max(-50, Math.min(50, momentum)) + 50;
  return Math.round((normMomentum * 0.6) + (sentiment * 0.4));
}

/**
 * Calculates narrative momentum with enhanced debugging.
 */
export function calculateNarrativeMomentum(results: any[]): number {
  if (!results) return 0;
  
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);

  let recentWeekCount = 0;
  let previousWeekCount = 0;
  
  // 🔧 ADDED: Debug logging as you suggested
  console.log(`📅 Analyzing dates: Recent week (${sevenDaysAgo.toISOString().split('T')[0]} to now), Previous week (${fourteenDaysAgo.toISOString().split('T')[0]} to ${sevenDaysAgo.toISOString().split('T')[0]})`);

  results.forEach(result => {
    if (!result.publishedDate) return;
    const publishedDate = new Date(result.publishedDate);
    const dateStr = publishedDate.toISOString().split('T')[0];
    
    if (publishedDate >= sevenDaysAgo) {
      recentWeekCount++;
      console.log(`📈 Recent: ${result.title?.slice(0, 50)}... (${dateStr})`);
    } else if (publishedDate >= fourteenDaysAgo) {
      previousWeekCount++;
      console.log(`📊 Previous: ${result.title?.slice(0, 50)}... (${dateStr})`);
    }
  });
  
  console.log(`🎯 Momentum calculation: Recent=${recentWeekCount}, Previous=${previousWeekCount}`);
  
  if (previousWeekCount === 0) {
    const momentum = recentWeekCount > 0 ? 100 : 0;
    console.log(`📈 Final momentum (no previous data): ${momentum}%`);
    return momentum;
  }

  const momentum = Math.round(((recentWeekCount - previousWeekCount) / previousWeekCount) * 100);
  console.log(`📈 Final momentum: ${momentum}%`);
  return momentum;
}