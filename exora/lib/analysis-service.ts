// lib/analysis-service.ts

// A simple placeholder for now. In a real app, this would be more sophisticated.
export function calculatePulseIndex(momentum: number, sentiment: number): number {
  // Normalize momentum (e.g., cap it at +/- 50%) and sentiment
  const normMomentum = Math.max(-50, Math.min(50, momentum)) + 50; // Range 0-100
  return Math.round((normMomentum * 0.6) + (sentiment * 0.4)); // 60% weight on momentum
}

export function calculateNarrativeMomentum(results: any[]): number {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 14);

    let recentWeekCount = 0;
    let previousWeekCount = 0;

    results.forEach(result => {
        const publishedDate = new Date(result.publishedDate);
        if (publishedDate >= sevenDaysAgo) {
            recentWeekCount++;
        } else if (publishedDate >= fourteenDaysAgo) {
            previousWeekCount++;
        }
    });
    
    if (previousWeekCount === 0) {
        return recentWeekCount > 0 ? 100 : 0; // Avoid division by zero
    }

    return Math.round(((recentWeekCount - previousWeekCount) / previousWeekCount) * 100);
}