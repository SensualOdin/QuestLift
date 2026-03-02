const STANDARD_PLATES = [45, 35, 25, 10, 5, 2.5]
const BAR_WEIGHT = 45

/**
 * Calculates the per-side plate breakdown for a given barbell weight.
 * Returns a human-readable string like "2×45" or "45 + 25", or null if
 * the weight is below 45 or not achievable with standard plates.
 */
export function calculatePlates(totalWeight: number): string | null {
  if (totalWeight < BAR_WEIGHT) return null
  if (totalWeight === BAR_WEIGHT) return "Bar only"

  const perSide = (totalWeight - BAR_WEIGHT) / 2
  if (perSide <= 0) return "Bar only"

  // Greedy assignment from largest plate down
  let remaining = perSide
  const plateCounts: { plate: number; count: number }[] = []

  for (const plate of STANDARD_PLATES) {
    if (remaining >= plate) {
      const count = Math.floor(remaining / plate)
      plateCounts.push({ plate, count })
      remaining = Math.round((remaining - plate * count) * 10) / 10 // avoid float drift
    }
  }

  if (remaining > 0) return null // not achievable with standard plates

  return plateCounts
    .map(({ plate, count }) => (count > 1 ? `${count}×${plate}` : `${plate}`))
    .join(" + ")
}
