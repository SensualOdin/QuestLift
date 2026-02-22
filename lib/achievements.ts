import { createClient } from './supabase/client'

export interface Achievement {
    id: string
    name: string
    description: string
    icon: string
    category: string
    condition_type: string
    condition_value: number
    reward_scraps: number
    reward_title?: string
}

export interface UserAchievement {
    achievement_id: string
    earned_at: string
    achievement?: Achievement
}

/**
 * Fetches all achievements and which ones the user has earned.
 */
export async function fetchAllAchievements(userId: string): Promise<{
    all: Achievement[]
    earned: Set<string>
}> {
    const supabase = createClient()

    const [{ data: all }, { data: earned }] = await Promise.all([
        (supabase.from as any)('achievements').select('*').order('reward_scraps', { ascending: true }),
        (supabase.from as any)('user_achievements').select('achievement_id').eq('user_id', userId)
    ])

    return {
        all: (all || []) as Achievement[],
        earned: new Set((earned || []).map((e: any) => e.achievement_id))
    }
}

/**
 * Checks all achievement conditions and awards any newly earned ones.
 * Returns the list of newly earned achievements (for toast display).
 */
export async function checkAndAwardAchievements(
    userId: string,
    sessionContext?: {
        sessionVolume?: number
        isComebackQuest?: boolean
    }
): Promise<Achievement[]> {
    const supabase = createClient()

    // Fetch all achievements and user's current earned set
    const { all: achievements, earned } = await fetchAllAchievements(userId)

    // Fetch user stats
    const { data: user } = await supabase
        .from('users')
        .select('level, class_name, iron_scraps, str_volume_lifetime, dex_minutes_lifetime, con_sets_lifetime, wis_minutes_lifetime, best_streak')
        .eq('id', userId)
        .single()

    if (!user) return []

    // Fetch various counts
    const [
        { count: workoutCount },
        { count: prCount },
        { count: partyCount },
        { count: raidDefeatedCount }
    ] = await Promise.all([
        supabase.from('workouts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('workout_sets').select('*, workouts!inner(user_id)', { count: 'exact', head: true })
            .eq('workouts.user_id', userId).eq('is_pr', true),
        supabase.from('party_members').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('raid_damage').select('raid_id, raids!inner(status)', { count: 'exact', head: true })
            .eq('user_id', userId).eq('raids.status', 'defeated')
    ])

    // Calculate streak
    const streak = await calculateStreak(userId)

    // Build condition values map
    const conditionValues: Record<string, number> = {
        workout_count: workoutCount || 0,
        pr_count: prCount || 0,
        level_reached: user.level || 1,
        class_selected: user.class_name ? 1 : 0,
        party_joined: (partyCount || 0) > 0 ? 1 : 0,
        raid_defeated: raidDefeatedCount || 0,
        streak_days: streak,
        total_volume_single: sessionContext?.sessionVolume || 0,
        comeback_triggered: sessionContext?.isComebackQuest ? 1 : 0,
        str_volume_lifetime: (user as any).str_volume_lifetime || 0,
        dex_minutes_lifetime: (user as any).dex_minutes_lifetime || 0,
        wis_minutes_lifetime: (user as any).wis_minutes_lifetime || 0,
        con_sets_lifetime: (user as any).con_sets_lifetime || 0,
        workout_streak_ever: (user as any).best_streak || 0,
    }

    // Check each unearned achievement
    const newlyEarned: Achievement[] = []

    for (const achievement of achievements) {
        if (earned.has(achievement.id)) continue

        const currentValue = conditionValues[achievement.condition_type] ?? 0
        if (currentValue >= achievement.condition_value) {
            // Award it
            const { error } = await (supabase.from as any)('user_achievements')
                .insert({ user_id: userId, achievement_id: achievement.id })

            if (!error) {
                newlyEarned.push(achievement)
            }
        }
    }

    // Award Iron Scraps for newly earned achievements
    if (newlyEarned.length > 0) {
        const totalScraps = newlyEarned.reduce((sum, a) => sum + (a.reward_scraps || 0), 0)
        if (totalScraps > 0) {
            await supabase
                .from('users')
                .update({ iron_scraps: (user.iron_scraps || 0) + totalScraps })
                .eq('id', userId)
        }
    }

    return newlyEarned
}

/**
 * Calculates the user's current workout streak (consecutive days with at least one workout).
 */
async function calculateStreak(userId: string): Promise<number> {
    const supabase = createClient()

    // Fetch the last 60 days of workout dates
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const { data: workouts } = await supabase
        .from('workouts')
        .select('start_time')
        .eq('user_id', userId)
        .gte('start_time', sixtyDaysAgo.toISOString())
        .order('start_time', { ascending: false })

    if (!workouts || workouts.length === 0) return 0

    // Get unique dates (YYYY-MM-DD)
    const workoutDates = new Set<string>()
    for (const w of workouts) {
        if (w.start_time) {
            const date = new Date(w.start_time).toISOString().split('T')[0]
            workoutDates.add(date)
        }
    }

    // Count consecutive days backward from today
    let streak = 0
    const today = new Date()

    for (let i = 0; i < 60; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(today.getDate() - i)
        const dateStr = checkDate.toISOString().split('T')[0]

        if (workoutDates.has(dateStr)) {
            streak++
        } else if (i === 0) {
            // Today hasn't had a workout yet - check from yesterday
            continue
        } else {
            break
        }
    }

    return streak
}
