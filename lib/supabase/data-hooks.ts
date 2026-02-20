import { createClient } from './client'
import type { Database } from '../supabase-types'
import { calculateStrengthSetXP, calculateCardioSetXP, calculateSessionXP, calculateLevelFromXP, getXPForNextLevel, type WorkoutSet, type ConsistencyContext } from '../xp-engine'
import { checkAndAwardAchievements, type Achievement } from '../achievements'

export type WorkoutActivity = Database['public']['Tables']['workouts']['Row']
export type WorkoutInsert = Database['public']['Tables']['workouts']['Insert']
export type WorkoutSetInsert = Database['public']['Tables']['workout_sets']['Insert']
export type Exercise = Database['public']['Tables']['exercises']['Row']
export type Quest = {
    id: string
    title: string
    description: string
    progress: number
    total: number
    type: 'daily' | 'weekly' | 'raid'
}

export async function fetchRecentActivity(userId: string): Promise<WorkoutActivity[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error fetching recent activity:', error)
        return []
    }

    return data || []
}

export async function fetchFullWorkoutHistory(userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('workouts')
        .select(`
            *,
            workout_sets (
                id, weight, reps, rpe, set_order, is_pr,
                exercises (
                    name, equipment, exercise_type
                )
            )
        `)
        .eq('user_id', userId)
        .order('start_time', { ascending: false })

    if (error) {
        console.error('Error fetching full history:', error)
        return []
    }

    return data || []
}

export async function fetchActiveQuests(userId: string): Promise<Quest[]> {
    const supabase = createClient()
    const quests: Quest[] = []

    // Weekly Warrior: Complete 4 workouts this week
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    startOfWeek.setHours(0, 0, 0, 0)

    const { count: weeklyCount } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('start_time', startOfWeek.toISOString())

    quests.push({
        id: 'weekly-warrior',
        title: 'Weekly Warrior',
        description: 'Complete 4 workouts this week to earn the Warrior title.',
        progress: Math.min(weeklyCount || 0, 4),
        total: 4,
        type: 'weekly'
    })

    // Daily Quest: Log at least 1 workout today
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    const { count: dailyCount } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('start_time', startOfDay.toISOString())

    quests.push({
        id: 'daily-grind',
        title: 'Daily Grind',
        description: 'Log a workout today to maintain your streak.',
        progress: Math.min(dailyCount || 0, 1),
        total: 1,
        type: 'daily'
    })

    // Volume Quest: Lift 10,000 lbs this week
    const { data: weekSets } = await supabase
        .from('workouts')
        .select('total_volume')
        .eq('user_id', userId)
        .gte('start_time', startOfWeek.toISOString())

    const weeklyVolume = (weekSets || []).reduce((sum, w) => sum + (w.total_volume || 0), 0)
    quests.push({
        id: 'volume-quest',
        title: 'Iron Forge',
        description: 'Lift 10,000 lbs total this week to temper your blade.',
        progress: Math.min(weeklyVolume, 10000),
        total: 10000,
        type: 'weekly'
    })

    // PR Hunter: Set 3 personal records this week
    const { count: weeklyPRCount } = await supabase
        .from('workout_sets')
        .select('*, workouts!inner(user_id, start_time)', { count: 'exact', head: true })
        .eq('workouts.user_id', userId)
        .eq('is_pr', true)
        .gte('workouts.start_time', startOfWeek.toISOString())

    quests.push({
        id: 'pr-hunter',
        title: 'PR Hunter',
        description: 'Set 3 personal records this week. Push your limits.',
        progress: Math.min(weeklyPRCount || 0, 3),
        total: 3,
        type: 'weekly'
    })

    // Raid Quest: Check if user has an active raid
    const { data: memberData } = await supabase
        .from('party_members')
        .select('party_id')
        .eq('user_id', userId)
        .single()

    if (memberData) {
        const { data: raid } = await supabase
            .from('raids')
            .select('id, boss_name, boss_max_hp')
            .eq('party_id', memberData.party_id)
            .eq('status', 'active')
            .single()

        if (raid) {
            const { data: damageData } = await supabase
                .from('raid_damage')
                .select('damage')
                .eq('raid_id', raid.id)

            const totalDamage = (damageData || []).reduce((sum, d) => sum + (d.damage || 0), 0)

            quests.push({
                id: `raid-${raid.id}`,
                title: `Defeat ${raid.boss_name}`,
                description: `Deal damage to the raid boss by logging workouts. 1 lb lifted = 1 DMG.`,
                progress: Math.min(totalDamage, raid.boss_max_hp),
                total: raid.boss_max_hp,
                type: 'raid'
            })
        }
    }

    return quests
}

export async function fetchAllExercises(): Promise<Exercise[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching exercises:', error)
        return []
    }
    return data || []
}

export async function fetchUserParty(userId: string) {
    const supabase = createClient()
    const { data: memberData, error: memberError } = await supabase
        .from('party_members')
        .select('party_id, parties(*)')
        .eq('user_id', userId)
        .single()

    if (memberError || !memberData || !memberData.parties) return null

    const partyId = memberData.party_id
    const { data: roster, error: rosterError } = await supabase
        .from('party_members')
        .select('user_id, role, users(display_name, class_name, level)')
        .eq('party_id', partyId)

    if (rosterError) return null

    return {
        party: memberData.parties,
        roster: roster
    }
}

export async function fetchActiveRaid(partyId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('raids')
        .select(`
            *,
            raid_damage (
                user_id, damage,
                users (display_name, class_name)
            )
        `)
        .eq('party_id', partyId)
        .eq('status', 'active')
        .single()

    if (error) return null
    return data
}

/**
 * Fetches the user's best (heaviest) set for a given exercise for PR comparison.
 */
export async function fetchExercisePR(userId: string, exerciseId: string): Promise<number> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('workout_sets')
        .select('weight, workout_id, workouts!inner(user_id)')
        .eq('workouts.user_id', userId)
        .eq('exercise_id', exerciseId)
        .order('weight', { ascending: false })
        .limit(1)
        .single()

    if (error || !data) return 0
    return data.weight || 0
}

/**
 * Fetches PR history for a specific exercise (for the progress chart).
 */
export async function fetchProgressData(userId: string, exerciseName?: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('workouts')
        .select(`
            start_time,
            workout_sets (
                weight, reps,
                exercises (name)
            )
        `)
        .eq('user_id', userId)
        .order('start_time', { ascending: true })

    if (error || !data) return []

    // Group best weight per workout date, optionally filtering by exercise
    const chartData: { date: string, weight: number }[] = []

    let runningMax = 0
    for (const workout of data) {
        if (!Array.isArray(workout.workout_sets)) continue

        let bestWeight = 0
        for (const set of workout.workout_sets as any[]) {
            const exName = set.exercises?.name
            if (exerciseName && exName !== exerciseName) continue
            const w = set.weight || 0
            if (w > bestWeight) bestWeight = w
        }

        if (bestWeight > 0 && bestWeight >= runningMax) {
            runningMax = bestWeight
            const dateStr = workout.start_time
                ? new Date(workout.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Unknown'
            chartData.push({ date: dateStr, weight: bestWeight })
        }
    }

    return chartData
}

/**
 * Fetches the latest roast report for a party.
 */
export async function fetchRoastReport(partyId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('roast_reports')
        .select(`
            *,
            mvp:users!roast_reports_mvp_user_id_fkey(display_name),
            slacker:users!roast_reports_slacker_user_id_fkey(display_name)
        `)
        .eq('party_id', partyId)
        .order('week_end', { ascending: false })
        .limit(1)
        .single()

    if (error || !data) return null
    return data
}

/**
 * Checks consistency bonuses for the user based on workout history.
 */
export async function getConsistencyContext(userId: string): Promise<ConsistencyContext> {
    const supabase = createClient()
    const now = new Date()

    // Check daily streak: did the user work out yesterday?
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)

    const { count: yesterdayCount } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('start_time', yesterday.toISOString())
        .lte('start_time', yesterdayEnd.toISOString())

    const dailyStreak = (yesterdayCount || 0) > 0

    // Weekly Warrior: 4+ workouts this week (including today's)
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    startOfWeek.setHours(0, 0, 0, 0)

    const { count: weeklyCount } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('start_time', startOfWeek.toISOString())

    const weeklyWarrior = (weeklyCount || 0) >= 3 // 3 previous + this one = 4

    // Monthly Warrior: 16+ workouts this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const { count: monthlyCount } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('start_time', startOfMonth.toISOString())

    const monthlyWarrior = (monthlyCount || 0) >= 15 // 15 previous + this one = 16

    // Comeback Quest: no workouts in 7+ days before today
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    const { count: recentCount } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('start_time', sevenDaysAgo.toISOString())
        .lt('start_time', startOfToday.toISOString())

    const comebackQuest = (recentCount || 0) === 0

    return { dailyStreak, weeklyWarrior, monthlyWarrior, comebackQuest }
}

/**
 * Join a party by join code.
 */
export async function joinPartyByCode(userId: string, joinCode: string): Promise<{ success: boolean, error?: string }> {
    const supabase = createClient()

    // Check if already in a party
    const { data: existing } = await supabase
        .from('party_members')
        .select('party_id')
        .eq('user_id', userId)
        .single()

    if (existing) {
        return { success: false, error: 'You are already in a party. Leave your current party first.' }
    }

    // Find party by join code
    const { data: party, error: partyError } = await supabase
        .from('parties')
        .select('id')
        .eq('join_code', joinCode.trim().toUpperCase())
        .single()

    if (partyError || !party) {
        return { success: false, error: 'Invalid join code. Please check and try again.' }
    }

    // Check party size
    const { count } = await supabase
        .from('party_members')
        .select('*', { count: 'exact', head: true })
        .eq('party_id', party.id)

    if ((count || 0) >= 5) {
        return { success: false, error: 'This party is full (5/5 members).' }
    }

    // Join
    const { error: joinError } = await supabase
        .from('party_members')
        .insert({ party_id: party.id, user_id: userId, role: 'member' })

    if (joinError) {
        return { success: false, error: 'Failed to join party. Please try again.' }
    }

    return { success: true }
}

/**
 * Saves a workout and updates all related user stats (XP, level, attributes, raid damage).
 */
export async function saveWorkoutSession(
    workout: WorkoutInsert,
    sets: WorkoutSetInsert[],
    exerciseTypes: Map<string, string>, // exercise_id -> exercise_type
    userId: string,
    userClassName?: string | null
): Promise<{ success: boolean, achievements: Achievement[] }> {
    const supabase = createClient()

    // Insert Workout
    const { data: insertedWorkout, error: workoutError } = await supabase
        .from('workouts')
        .insert(workout)
        .select()
        .single()

    if (workoutError || !insertedWorkout) {
        console.error('Error saving workout:', workoutError)
        return { success: false, achievements: [] }
    }

    // Assign Workout ID to all sets
    const setsWithWorkoutId = sets.map(set => ({
        ...set,
        workout_id: insertedWorkout.id
    }))

    // Insert Sets
    const { error: setsError } = await supabase
        .from('workout_sets')
        .insert(setsWithWorkoutId)

    if (setsError) {
        console.error('Error saving workout sets:', setsError)
        return { success: false, achievements: [] }
    }

    // Calculate XP using the real XP engine
    const consistency = await getConsistencyContext(userId)

    const xpSets = sets.map(set => {
        const exType = exerciseTypes.get(set.exercise_id) || 'Strength'
        const isStrength = exType === 'Strength'

        // Determine class specialty
        const isSpecialty = determineClassSpecialty(userClassName, exType)

        const data: WorkoutSet = isStrength
            ? { weight: set.weight || undefined, reps: set.reps || undefined, rpe: set.rpe || undefined }
            : { durationMinutes: set.reps || undefined, rpe: set.rpe || undefined } // reps stores duration for cardio

        return {
            type: (isStrength ? 'Strength' : 'Cardio') as 'Strength' | 'Cardio',
            data,
            isSpecialty
        }
    })

    const xpEarned = calculateSessionXP(xpSets, consistency)

    // Update the workout record with real XP
    await supabase
        .from('workouts')
        .update({ xp_earned: xpEarned })
        .eq('id', insertedWorkout.id)

    // Update user stats
    let strVolume = 0
    let dexMinutes = 0
    let conSets = sets.length

    for (const set of sets) {
        const exType = exerciseTypes.get(set.exercise_id) || 'Strength'
        if (exType === 'Strength') {
            strVolume += (set.weight || 0) * (set.reps || 0)
        } else {
            dexMinutes += (set.reps || 0) // reps stores duration for cardio
        }
    }

    // Fetch current user data to compute new level
    const { data: currentUser } = await supabase
        .from('users')
        .select('xp_current, level, str_volume_lifetime, dex_minutes_lifetime, con_sets_lifetime')
        .eq('id', userId)
        .single()

    if (currentUser) {
        const newXpCurrent = (currentUser.xp_current || 0) + xpEarned
        const newStrVolume = (currentUser.str_volume_lifetime || 0) + strVolume
        const newDexMinutes = (currentUser.dex_minutes_lifetime || 0) + dexMinutes
        const newConSets = (currentUser.con_sets_lifetime || 0) + conSets

        // Compute new level from total lifetime XP
        // Since xp_current is cumulative, we use it directly for level calculation
        const newLevel = calculateLevelFromXP(newXpCurrent)

        await supabase
            .from('users')
            .update({
                xp_current: newXpCurrent,
                level: newLevel,
                str_volume_lifetime: newStrVolume,
                dex_minutes_lifetime: newDexMinutes,
                con_sets_lifetime: newConSets
            })
            .eq('id', userId)
    }

    // Record raid damage if user is in an active raid
    const { data: memberData } = await supabase
        .from('party_members')
        .select('party_id')
        .eq('user_id', userId)
        .single()

    if (memberData) {
        const { data: activeRaid } = await supabase
            .from('raids')
            .select('id, boss_max_hp')
            .eq('party_id', memberData.party_id)
            .eq('status', 'active')
            .single()

        if (activeRaid) {
            // Damage = total volume (1 lb = 1 DMG) + cardio damage (50 DMG/min at RPE 8+)
            let damage = strVolume
            for (const set of sets) {
                const exType = exerciseTypes.get(set.exercise_id) || 'Strength'
                if (exType !== 'Strength' && (set.rpe || 0) >= 8) {
                    damage += (set.reps || 0) * 50 // reps = duration for cardio, 50 DMG/min
                }
            }

            if (damage > 0) {
                await supabase
                    .from('raid_damage')
                    .insert({
                        raid_id: activeRaid.id,
                        user_id: userId,
                        workout_id: insertedWorkout.id,
                        damage: damage
                    })

                // Check if boss is defeated
                const { data: allDamage } = await supabase
                    .from('raid_damage')
                    .select('damage')
                    .eq('raid_id', activeRaid.id)

                const totalDmg = (allDamage || []).reduce((sum, d) => sum + (d.damage || 0), 0)
                if (totalDmg >= activeRaid.boss_max_hp) {
                    await supabase
                        .from('raids')
                        .update({ status: 'defeated' })
                        .eq('id', activeRaid.id)
                }
            }
        }
    }

    // Check and award achievements
    const newAchievements = await checkAndAwardAchievements(userId, {
        sessionVolume: strVolume,
        isComebackQuest: consistency.comebackQuest
    })

    return { success: true, achievements: newAchievements }
}

/**
 * Determines if an exercise type matches the user's class specialty.
 */
function determineClassSpecialty(className: string | null | undefined, exerciseType: string): boolean {
    if (!className) return false
    switch (className) {
        case 'Tank':
            return exerciseType === 'Strength'
        case 'Rogue':
            return exerciseType === 'Cardio' || exerciseType === 'Mobility'
        case 'Paladin':
            return exerciseType === 'Strength' // Paladin specializes in volume work
        default:
            return false
    }
}

/**
 * Updates user class selection.
 */
export async function updateUserClass(userId: string, className: string): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase
        .from('users')
        .update({ class_name: className })
        .eq('id', userId)

    return !error
}
