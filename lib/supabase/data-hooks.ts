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
    reward?: number
    completed?: boolean
}

// --- Rotating Quest Pool ---

type QuestCondition =
    | 'daily_workout_count'
    | 'daily_volume'
    | 'daily_sets'
    | 'daily_category_legs'
    | 'daily_category_chest'
    | 'daily_category_back'
    | 'daily_category_shoulders'
    | 'weekly_workout_count'
    | 'weekly_volume'
    | 'weekly_pr_count'
    | 'weekly_weekend_workout'
    | 'weekly_categories'

interface QuestTemplate {
    id: string
    title: string
    description: string
    type: 'daily' | 'weekly'
    condition: QuestCondition
    total: number
    reward: number
}

const DAILY_QUEST_POOL: QuestTemplate[] = [
    { id: 'd-log-workout', title: 'Daily Grind', description: 'Log a workout today to maintain your streak.', type: 'daily', condition: 'daily_workout_count', total: 1, reward: 25 },
    { id: 'd-volume-3k', title: 'Heavy Hitter', description: 'Lift 3,000 lbs in a single day.', type: 'daily', condition: 'daily_volume', total: 3000, reward: 35 },
    { id: 'd-volume-5k', title: 'Iron Pumper', description: 'Lift 5,000 lbs in a single day.', type: 'daily', condition: 'daily_volume', total: 5000, reward: 50 },
    { id: 'd-sets-10', title: 'Set Stacker', description: 'Complete 10 sets today.', type: 'daily', condition: 'daily_sets', total: 10, reward: 30 },
    { id: 'd-sets-15', title: 'Rep Machine', description: 'Complete 15 sets today. No slacking.', type: 'daily', condition: 'daily_sets', total: 15, reward: 45 },
    { id: 'd-legs', title: 'Leg Day', description: 'Train legs today. No skipping.', type: 'daily', condition: 'daily_category_legs', total: 1, reward: 30 },
    { id: 'd-chest', title: 'Chest Quest', description: 'Hit a chest exercise today.', type: 'daily', condition: 'daily_category_chest', total: 1, reward: 30 },
    { id: 'd-back', title: 'Back Attack', description: 'Train your back today.', type: 'daily', condition: 'daily_category_back', total: 1, reward: 30 },
    { id: 'd-shoulders', title: 'Boulder Shoulders', description: 'Train shoulders today.', type: 'daily', condition: 'daily_category_shoulders', total: 1, reward: 30 },
]

const WEEKLY_QUEST_POOL: QuestTemplate[] = [
    { id: 'w-workouts-3', title: 'Consistent', description: 'Complete 3 workouts this week.', type: 'weekly', condition: 'weekly_workout_count', total: 3, reward: 75 },
    { id: 'w-workouts-5', title: 'Weekly Warrior', description: 'Complete 5 workouts this week.', type: 'weekly', condition: 'weekly_workout_count', total: 5, reward: 125 },
    { id: 'w-volume-15k', title: 'Iron Forge', description: 'Lift 15,000 lbs total this week.', type: 'weekly', condition: 'weekly_volume', total: 15000, reward: 100 },
    { id: 'w-volume-25k', title: 'Steel Temperer', description: 'Lift 25,000 lbs total this week.', type: 'weekly', condition: 'weekly_volume', total: 25000, reward: 150 },
    { id: 'w-prs-2', title: 'PR Hunter', description: 'Set 2 personal records this week.', type: 'weekly', condition: 'weekly_pr_count', total: 2, reward: 100 },
    { id: 'w-prs-5', title: 'Record Breaker', description: 'Set 5 personal records this week. Push your limits.', type: 'weekly', condition: 'weekly_pr_count', total: 5, reward: 150 },
    { id: 'w-weekend', title: 'Weekend Warrior', description: 'Log a workout on Saturday or Sunday.', type: 'weekly', condition: 'weekly_weekend_workout', total: 1, reward: 75 },
]

/** Simple deterministic hash to pick quests from pool */
function seedHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash |= 0 // Convert to 32bit integer
    }
    return Math.abs(hash)
}

/** Pick N unique items from a pool using a seeded index */
function pickFromPool<T>(pool: T[], count: number, seed: number): T[] {
    const picked: T[] = []
    const indices = new Set<number>()
    let attempt = seed
    while (picked.length < count && picked.length < pool.length) {
        const idx = attempt % pool.length
        if (!indices.has(idx)) {
            indices.add(idx)
            picked.push(pool[idx])
        }
        attempt = seedHash(attempt.toString() + 'x')
    }
    return picked
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
    const now = new Date()

    // --- Time boundaries ---
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    // --- Seeded quest selection ---
    const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
    const weekStr = `${now.getFullYear()}-W${Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)}`

    const dailySeed = seedHash(userId + dateStr)
    const weeklySeed = seedHash(userId + weekStr)

    const selectedDailies = pickFromPool(DAILY_QUEST_POOL, 2, dailySeed)
    const selectedWeeklies = pickFromPool(WEEKLY_QUEST_POOL, 2, weeklySeed)

    // --- Fetch all data we might need (parallel) ---
    const [
        { count: dailyWorkoutCount },
        { count: weeklyWorkoutCount },
        { data: dailyWorkouts },
        { data: weeklyWorkouts },
        { count: dailySetCount },
        { count: weeklyPRCount },
        { data: dailySetsWithCategory },
        { count: weekendWorkoutCount },
    ] = await Promise.all([
        supabase.from('workouts').select('*', { count: 'exact', head: true })
            .eq('user_id', userId).gte('start_time', startOfDay.toISOString()),
        supabase.from('workouts').select('*', { count: 'exact', head: true })
            .eq('user_id', userId).gte('start_time', startOfWeek.toISOString()),
        supabase.from('workouts').select('total_volume')
            .eq('user_id', userId).gte('start_time', startOfDay.toISOString()),
        supabase.from('workouts').select('total_volume')
            .eq('user_id', userId).gte('start_time', startOfWeek.toISOString()),
        supabase.from('workout_sets').select('*, workouts!inner(user_id, start_time)', { count: 'exact', head: true })
            .eq('workouts.user_id', userId).gte('workouts.start_time', startOfDay.toISOString()),
        supabase.from('workout_sets').select('*, workouts!inner(user_id, start_time)', { count: 'exact', head: true })
            .eq('workouts.user_id', userId).eq('is_pr', true).gte('workouts.start_time', startOfWeek.toISOString()),
        supabase.from('workout_sets').select('exercise_id, exercises!inner(category), workouts!inner(user_id, start_time)')
            .eq('workouts.user_id', userId).gte('workouts.start_time', startOfDay.toISOString()),
        // Weekend workouts: Sat (6) and Sun (0) this week
        supabase.from('workouts').select('start_time', { count: 'exact', head: true })
            .eq('user_id', userId).gte('start_time', startOfWeek.toISOString())
            // We'll filter weekend client-side below
    ])

    const dailyVolume = (dailyWorkouts || []).reduce((sum, w) => sum + (w.total_volume || 0), 0)
    const weeklyVolume = (weeklyWorkouts || []).reduce((sum, w) => sum + (w.total_volume || 0), 0)

    // Check which categories were trained today
    const todayCategories = new Set<string>()
    for (const s of (dailySetsWithCategory || [])) {
        const cat = (s as any).exercises?.category
        if (cat) todayCategories.add(cat.toLowerCase())
    }

    // Build condition values map
    const conditionValues: Record<QuestCondition, number> = {
        daily_workout_count: dailyWorkoutCount || 0,
        daily_volume: dailyVolume,
        daily_sets: dailySetCount || 0,
        daily_category_legs: todayCategories.has('legs') ? 1 : 0,
        daily_category_chest: todayCategories.has('chest') ? 1 : 0,
        daily_category_back: todayCategories.has('back') ? 1 : 0,
        daily_category_shoulders: todayCategories.has('shoulders') ? 1 : 0,
        weekly_workout_count: weeklyWorkoutCount || 0,
        weekly_volume: weeklyVolume,
        weekly_pr_count: weeklyPRCount || 0,
        weekly_weekend_workout: weekendWorkoutCount || 0,
        weekly_categories: 0, // unused for now
    }

    // --- Build quest objects from selected templates ---
    const allSelected = [...selectedDailies, ...selectedWeeklies]
    for (const template of allSelected) {
        const progress = Math.min(conditionValues[template.condition] || 0, template.total)
        quests.push({
            id: template.id,
            title: template.title,
            description: template.description,
            progress,
            total: template.total,
            type: template.type,
            reward: template.reward,
            completed: progress >= template.total,
        })
    }

    // --- Raid Quest (always shown if active) ---
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
