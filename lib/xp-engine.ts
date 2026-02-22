// lib/xp-engine.ts

export type WorkoutType = 'Strength' | 'Cardio' | 'Mobility' | 'Recovery'

export interface WorkoutSet {
    weight?: number
    reps?: number
    durationMinutes?: number
    rpe?: number
    oneRepMaxFallback?: number // User's known 1RM for this lift
}

export interface ConsistencyContext {
    dailyStreak: boolean
    weeklyWarrior: boolean
    monthlyWarrior: boolean
    comebackQuest: boolean // > 7 days inactivity
}

/**
 * Calculates XP for a single Strength or Hypertrophy set.
 */
export function calculateStrengthSetXP(set: WorkoutSet, isClassSpecialty: boolean = false): number {
    if (!set.weight || !set.reps) return 0

    const volume = set.weight * set.reps
    const baseXP = volume / 100

    // Determine intensity multiplier
    let intensityMultiplier = 1.0

    // Prefer 1RM percentage over subjective RPE if 1RM is known
    if (set.oneRepMaxFallback && set.oneRepMaxFallback > 0) {
        const percentage = set.weight / set.oneRepMaxFallback
        if (percentage > 0.85) intensityMultiplier = 1.2
        else if (percentage >= 0.70) intensityMultiplier = 1.1
    } else if (set.rpe) {
        if (set.rpe >= 9) intensityMultiplier = 1.2
        else if (set.rpe >= 8) intensityMultiplier = 1.1
    }

    let xp = baseXP * intensityMultiplier

    // Apply Class bonus if applicable (15% bonus for specialty lifts)
    if (isClassSpecialty) {
        xp *= 1.15
    }

    return xp
}

/**
 * Calculates XP for a Cardio or Mobility set (based on duration and RPE).
 */
export function calculateCardioSetXP(set: WorkoutSet, isClassSpecialty: boolean = false): number {
    if (!set.durationMinutes) return 0

    let effortMultiplier = 3 // Base low intensity (RPE 1-7)

    if (set.rpe) {
        if (set.rpe >= 9) effortMultiplier = 5 // High intensity (HIIT)
        else if (set.rpe >= 8) effortMultiplier = 4 // Moderate intensity
    }

    let xp = set.durationMinutes * effortMultiplier

    if (isClassSpecialty) {
        xp *= 1.15
    }

    return xp
}

/**
 * Calculates the total XP for an entire workout session, including consistency bonuses.
 */
export function calculateSessionXP(
    sets: { type: WorkoutType, data: WorkoutSet, isSpecialty: boolean }[],
    consistency: ConsistencyContext
): number {
    let sessionBaseXP = 0

    for (const set of sets) {
        if (set.type === 'Strength') {
            sessionBaseXP += calculateStrengthSetXP(set.data, set.isSpecialty)
        } else {
            sessionBaseXP += calculateCardioSetXP(set.data, set.isSpecialty)
        }
    }

    // Apply Comeback Quest multiplier first if applicable
    if (consistency.comebackQuest) {
        sessionBaseXP *= 2
    }

    // Add flat consistency bonuses
    if (consistency.dailyStreak) sessionBaseXP += 50
    if (consistency.weeklyWarrior) sessionBaseXP += 200
    if (consistency.monthlyWarrior) sessionBaseXP += 500

    return Math.round(sessionBaseXP)
}

/**
 * Determines current level based on total lifetime XP.
 * Uses a fast early curve that slows significantly at higher levels.
 */
export function calculateLevelFromXP(totalXP: number): number {
    const levels = [
        { startLvl: 1, endLvl: 5, xpPerLevel: 500, startXp: 0 },
        { startLvl: 6, endLvl: 15, xpPerLevel: 1500, startXp: 2500 },
        { startLvl: 16, endLvl: 30, xpPerLevel: 5000, startXp: 17500 },
        { startLvl: 31, endLvl: 50, xpPerLevel: 15000, startXp: 92500 },
    ]

    let currentLevel = 1

    for (const bracket of levels) {
        if (totalXP >= bracket.startXp) {
            if (bracket.endLvl === 50 && totalXP >= bracket.startXp + (20 * bracket.xpPerLevel)) {
                // Above 50, standard 50,000 XP per level
                const xpOver50 = totalXP - (bracket.startXp + (20 * bracket.xpPerLevel))
                return 51 + Math.floor(xpOver50 / 50000)
            }

            const xpInBracket = totalXP - bracket.startXp
            const levelsInBracket = Math.floor(xpInBracket / bracket.xpPerLevel)

            if (currentLevel + levelsInBracket <= bracket.endLvl) {
                currentLevel = bracket.startLvl + levelsInBracket
            } else {
                currentLevel = bracket.endLvl
            }
        }
    }

    return currentLevel
}

/**
 * Helper to determine XP needed for the *next* level.
 */
export function getXPForNextLevel(currentLevel: number): number {
    if (currentLevel < 5) return 500;
    if (currentLevel < 15) return 1500;
    if (currentLevel < 30) return 5000;
    if (currentLevel < 50) return 15000;
    return 50000; // Level 50+ threshold
}
