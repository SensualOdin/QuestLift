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

// --- Bounty System (Adventurer's Guild) ---

type BountyCondition =
    | 'bounty_volume_single_session'
    | 'bounty_sets_in_session'
    | 'bounty_cardio_minutes'
    | 'bounty_recovery_minutes'
    | 'bounty_mixed_session'
    | 'bounty_high_rpe_cardio'
    | 'bounty_morning_workout'
    | 'bounty_unique_exercises'

interface BountyTemplate {
    id: string
    title: string
    description: string
    condition: BountyCondition
    total: number
    rewardXP: number
    rewardScraps: number
}

const BOUNTY_POOL: BountyTemplate[] = [
    { id: 'b-boulder', title: 'Lift the Boulder', description: 'Lift 10,000 lbs total volume in one session.', condition: 'bounty_volume_single_session', total: 10000, rewardXP: 300, rewardScraps: 50 },
    { id: 'b-forge', title: 'The Forge', description: 'Complete 20 sets of strength exercises today.', condition: 'bounty_sets_in_session', total: 20, rewardXP: 250, rewardScraps: 40 },
    { id: 'b-anvil', title: 'Anvil Strike', description: 'Lift 5,000 lbs in one session.', condition: 'bounty_volume_single_session', total: 5000, rewardXP: 200, rewardScraps: 30 },
    { id: 'b-colossus', title: 'Colossus', description: 'Lift 20,000 lbs total volume in one session.', condition: 'bounty_volume_single_session', total: 20000, rewardXP: 500, rewardScraps: 100 },
    { id: 'b-iron-rain', title: 'Iron Rain', description: 'Complete 25 sets in one session.', condition: 'bounty_sets_in_session', total: 25, rewardXP: 300, rewardScraps: 50 },
    { id: 'b-goblin', title: 'The Goblin Tunnels', description: 'Log 30 minutes of cardio today.', condition: 'bounty_cardio_minutes', total: 30, rewardXP: 300, rewardScraps: 50 },
    { id: 'b-wind-sprint', title: 'Wind Sprint', description: 'Log a cardio session at RPE 9+.', condition: 'bounty_high_rpe_cardio', total: 1, rewardXP: 250, rewardScraps: 40 },
    { id: 'b-marathon', title: 'Marathon Runner', description: 'Log 60 minutes of cardio today.', condition: 'bounty_cardio_minutes', total: 60, rewardXP: 400, rewardScraps: 75 },
    { id: 'b-chase', title: 'The Chase', description: 'Log 15 minutes of cardio today.', condition: 'bounty_cardio_minutes', total: 15, rewardXP: 150, rewardScraps: 25 },
    { id: 'b-meditate', title: 'Meditate', description: 'Log 15 minutes of recovery work.', condition: 'bounty_recovery_minutes', total: 15, rewardXP: 200, rewardScraps: 30 },
    { id: 'b-inner-peace', title: 'Inner Peace', description: 'Log 30 minutes of yoga or stretching.', condition: 'bounty_recovery_minutes', total: 30, rewardXP: 300, rewardScraps: 50 },
    { id: 'b-healing', title: 'The Healing Springs', description: 'Log 45 minutes of recovery work.', condition: 'bounty_recovery_minutes', total: 45, rewardXP: 350, rewardScraps: 60 },
    { id: 'b-spectrum', title: 'Full Spectrum', description: 'Log both strength and cardio in one session.', condition: 'bounty_mixed_session', total: 1, rewardXP: 350, rewardScraps: 60 },
    { id: 'b-gauntlet', title: 'The Gauntlet', description: 'Complete 30 sets in one session.', condition: 'bounty_sets_in_session', total: 30, rewardXP: 400, rewardScraps: 75 },
    { id: 'b-dawn', title: 'Dawn Patrol', description: 'Log a workout before 8 AM.', condition: 'bounty_morning_workout', total: 1, rewardXP: 200, rewardScraps: 50 },
    { id: 'b-explorer', title: 'The Explorer', description: 'Use 5 different exercises in one session.', condition: 'bounty_unique_exercises', total: 5, rewardXP: 250, rewardScraps: 40 },
    { id: 'b-scholar', title: 'The Scholar', description: 'Use 8 different exercises in one session.', condition: 'bounty_unique_exercises', total: 8, rewardXP: 400, rewardScraps: 75 },
    { id: 'b-juggernaut', title: 'Juggernaut', description: 'Complete 15 sets in one session.', condition: 'bounty_sets_in_session', total: 15, rewardXP: 200, rewardScraps: 30 },
    { id: 'b-berserker', title: 'Berserker', description: 'Lift 15,000 lbs in one session.', condition: 'bounty_volume_single_session', total: 15000, rewardXP: 400, rewardScraps: 75 },
    { id: 'b-warmup', title: 'Proper Warmup', description: 'Log 10 minutes of recovery work.', condition: 'bounty_recovery_minutes', total: 10, rewardXP: 150, rewardScraps: 20 },
    { id: 'b-endurance', title: 'Endurance Test', description: 'Log 45 minutes of cardio.', condition: 'bounty_cardio_minutes', total: 45, rewardXP: 350, rewardScraps: 60 },
    { id: 'b-variety', title: 'Variety Pack', description: 'Use 6 different exercises in one session.', condition: 'bounty_unique_exercises', total: 6, rewardXP: 300, rewardScraps: 50 },
    { id: 'b-titan', title: 'Titan Training', description: 'Lift 25,000 lbs in one session.', condition: 'bounty_volume_single_session', total: 25000, rewardXP: 600, rewardScraps: 125 },
    { id: 'b-quickdraw', title: 'Quick Draw', description: 'Complete 10 sets in one session.', condition: 'bounty_sets_in_session', total: 10, rewardXP: 150, rewardScraps: 25 },
    { id: 'b-sprint', title: 'Sprint Session', description: 'Log 10 minutes of cardio.', condition: 'bounty_cardio_minutes', total: 10, rewardXP: 150, rewardScraps: 25 },
    { id: 'b-double-down', title: 'Double Down', description: 'Lift 7,500 lbs in one session.', condition: 'bounty_volume_single_session', total: 7500, rewardXP: 250, rewardScraps: 40 },
    { id: 'b-zen', title: 'Zen Master', description: 'Log 20 minutes of recovery work.', condition: 'bounty_recovery_minutes', total: 20, rewardXP: 250, rewardScraps: 35 },
    { id: 'b-allrounder', title: 'All-Rounder', description: 'Use 4 different exercises in one session.', condition: 'bounty_unique_exercises', total: 4, rewardXP: 200, rewardScraps: 30 },
]

export type Bounty = {
    id: string
    title: string
    description: string
    progress: number
    total: number
    rewardXP: number
    rewardScraps: number
    completed: boolean
}

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

export async function fetchActiveBounties(userId: string): Promise<Bounty[]> {
    const supabase = createClient()
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const bountySeed = seedHash(userId + dateStr + 'bounty')
    const selectedBounties = pickFromPool(BOUNTY_POOL, 2, bountySeed)

    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    const { data: todayWorkouts } = await supabase
        .from('workouts')
        .select('id, total_volume, start_time, workout_sets(id, weight, reps, rpe, exercise_id, exercises(exercise_type, name))')
        .eq('user_id', userId)
        .gte('start_time', startOfDay.toISOString())

    let maxSessionVolume = 0
    let maxSessionSets = 0
    let totalCardioMinutes = 0
    let totalRecoveryMinutes = 0
    let hasHighRPECardio = false
    let hasMixedSession = false
    let hasMorningWorkout = false
    let maxUniqueExercises = 0

    for (const workout of (todayWorkouts || [])) {
        const sets = (workout.workout_sets || []) as any[]
        let sessionVolume = 0
        let sessionHasStrength = false
        let sessionHasCardio = false
        const exerciseNames = new Set<string>()

        for (const set of sets) {
            const exType = set.exercises?.exercise_type || 'Strength'
            exerciseNames.add(set.exercises?.name || '')

            if (exType === 'Strength') {
                sessionVolume += (Number(set.weight) || 0) * (Number(set.reps) || 0)
                sessionHasStrength = true
            } else if (exType === 'Recovery') {
                totalRecoveryMinutes += Number(set.reps) || 0
            } else {
                totalCardioMinutes += Number(set.reps) || 0
                sessionHasCardio = true
                if ((Number(set.rpe) || 0) >= 9) hasHighRPECardio = true
            }
        }

        maxSessionVolume = Math.max(maxSessionVolume, sessionVolume)
        maxSessionSets = Math.max(maxSessionSets, sets.length)
        maxUniqueExercises = Math.max(maxUniqueExercises, exerciseNames.size)
        if (sessionHasStrength && sessionHasCardio) hasMixedSession = true
        if (workout.start_time) {
            const hour = new Date(workout.start_time).getHours()
            if (hour < 8) hasMorningWorkout = true
        }
    }

    const conditionValues: Record<BountyCondition, number> = {
        bounty_volume_single_session: maxSessionVolume,
        bounty_sets_in_session: maxSessionSets,
        bounty_cardio_minutes: totalCardioMinutes,
        bounty_recovery_minutes: totalRecoveryMinutes,
        bounty_mixed_session: hasMixedSession ? 1 : 0,
        bounty_high_rpe_cardio: hasHighRPECardio ? 1 : 0,
        bounty_morning_workout: hasMorningWorkout ? 1 : 0,
        bounty_unique_exercises: maxUniqueExercises,
    }

    return selectedBounties.map(template => {
        const progress = Math.min(conditionValues[template.condition] || 0, template.total)
        return {
            id: template.id,
            title: template.title,
            description: template.description,
            progress,
            total: template.total,
            rewardXP: template.rewardXP,
            rewardScraps: template.rewardScraps,
            completed: progress >= template.total,
        }
    })
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
        .maybeSingle()

    if (memberData) {
        const { data: raid } = await supabase
            .from('raids')
            .select('id, boss_name, boss_max_hp')
            .eq('party_id', memberData.party_id)
            .eq('status', 'active')
            .maybeSingle()

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
        .limit(1)
        .maybeSingle()

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

// --- Raid Boss Pool ---

interface RaidBossTemplate {
    name: string
    hp: number
    shield_type?: 'swift' | 'arcane' | 'iron' | null
    shield_hp?: number
    boss_weakness?: 'physical' | 'cardio' | 'magic' | null
    boss_resistance?: 'physical' | 'cardio' | 'magic' | null
}

const RAID_BOSS_POOL: RaidBossTemplate[] = [
    // Tier 1 — No shields, simple
    { name: 'Goblin Warlord', hp: 50000, boss_weakness: 'physical', boss_resistance: null },
    { name: 'Skeleton King', hp: 75000, boss_weakness: 'magic', boss_resistance: 'physical' },
    { name: 'Shadow Stalker', hp: 60000, boss_weakness: 'cardio', boss_resistance: null },
    { name: 'Dire Wolf Alpha', hp: 40000, boss_weakness: null, boss_resistance: null },
    { name: 'Cursed Minotaur', hp: 80000, boss_weakness: 'physical', boss_resistance: 'magic' },

    // Tier 2 — Shields
    { name: 'Iron Golem', hp: 100000, shield_type: 'iron', shield_hp: 25000, boss_weakness: 'magic', boss_resistance: 'physical' },
    { name: 'Storm Drake', hp: 120000, shield_type: 'swift', shield_hp: 30000, boss_weakness: 'physical', boss_resistance: 'cardio' },
    { name: 'Arcane Lich', hp: 90000, shield_type: 'arcane', shield_hp: 20000, boss_weakness: 'cardio', boss_resistance: 'magic' },
    { name: 'Frost Giant', hp: 150000, shield_type: 'iron', shield_hp: 40000, boss_weakness: 'magic', boss_resistance: null },
    { name: 'Phantom Wraith', hp: 100000, shield_type: 'swift', shield_hp: 25000, boss_weakness: null, boss_resistance: 'physical' },

    // Tier 3 — Tough bosses
    { name: 'Volcanic Titan', hp: 200000, shield_type: 'iron', shield_hp: 50000, boss_weakness: 'cardio', boss_resistance: 'physical' },
    { name: 'Abyssal Leviathan', hp: 250000, shield_type: 'arcane', shield_hp: 60000, boss_weakness: 'physical', boss_resistance: 'magic' },
    { name: 'Celestial Dragon', hp: 300000, shield_type: 'swift', shield_hp: 75000, boss_weakness: 'magic', boss_resistance: 'cardio' },
    { name: 'The World Eater', hp: 500000, shield_type: 'arcane', shield_hp: 100000, boss_weakness: null, boss_resistance: null },
    { name: 'Odin\'s Shadow', hp: 350000, shield_type: 'iron', shield_hp: 80000, boss_weakness: 'cardio', boss_resistance: 'magic' },
]

/**
 * Spawns a weekly raid boss for a party.
 * Picks a random boss from the pool, lasts 7 days.
 */
async function spawnRaidBoss(partyId: string) {
    const supabase = createClient()
    const boss = RAID_BOSS_POOL[Math.floor(Math.random() * RAID_BOSS_POOL.length)]
    const now = new Date()
    const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    const { data, error } = await supabase
        .from('raids')
        .insert({
            party_id: partyId,
            boss_name: boss.name,
            boss_max_hp: boss.hp,
            status: 'active',
            start_time: now.toISOString(),
            end_time: endTime.toISOString(),
            shield_type: boss.shield_type || null,
            shield_hp: boss.shield_hp || null,
            shield_hp_current: boss.shield_hp || null,
            boss_weakness: boss.boss_weakness || null,
            boss_resistance: boss.boss_resistance || null,
        })
        .select()
        .single()

    if (error) {
        console.error('Error spawning raid boss:', error)
        return null
    }
    return data
}

export async function fetchActiveRaid(partyId: string) {
    const supabase = createClient()

    // Expire any active raids past their end_time
    await supabase
        .from('raids')
        .update({ status: 'expired' })
        .eq('party_id', partyId)
        .eq('status', 'active')
        .lt('end_time', new Date().toISOString())

    const { data, error } = await supabase
        .from('raids')
        .select(`
            *,
            raid_damage (
                user_id, damage, damage_type,
                users (display_name, class_name)
            )
        `)
        .eq('party_id', partyId)
        .eq('status', 'active')
        .maybeSingle()

    if (data) return data

    // No active raid — check if we should spawn one
    // Find the most recent raid for this party
    const { data: lastRaid } = await supabase
        .from('raids')
        .select('end_time, status')
        .eq('party_id', partyId)
        .order('end_time', { ascending: false })
        .limit(1)
        .maybeSingle()

    let shouldSpawn = false

    if (!lastRaid) {
        // No raids ever — spawn the first one
        shouldSpawn = true
    } else {
        // Spawn if 24 hours have passed since the last raid ended
        const lastEnd = new Date(lastRaid.end_time)
        const hoursSinceEnd = (Date.now() - lastEnd.getTime()) / (1000 * 60 * 60)
        if (hoursSinceEnd >= 24) {
            shouldSpawn = true
        }
    }

    if (shouldSpawn) {
        const newRaid = await spawnRaidBoss(partyId)
        if (newRaid) {
            // Re-fetch with full relations
            const { data: fullRaid } = await supabase
                .from('raids')
                .select(`
                    *,
                    raid_damage (
                        user_id, damage, damage_type,
                        users (display_name, class_name)
                    )
                `)
                .eq('id', newRaid.id)
                .single()
            return fullRaid
        }
    }

    return null
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
        .maybeSingle()

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
        .maybeSingle()

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
        .maybeSingle()

    if (existing) {
        return { success: false, error: 'You are already in a party. Leave your current party first.' }
    }

    // Find party by join code
    const { data: party, error: partyError } = await supabase
        .from('parties')
        .select('id')
        .ilike('join_code', joinCode.trim())
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
 * Disband a party (leader only). Deletes the party — members cascade via FK.
 */
export async function disbandParty(userId: string, partyId: string): Promise<{ success: boolean, error?: string }> {
    const supabase = createClient()

    // Verify the user is the leader
    const { data: member } = await supabase
        .from('party_members')
        .select('role')
        .eq('party_id', partyId)
        .eq('user_id', userId)
        .single()

    if (!member || member.role !== 'leader') {
        return { success: false, error: 'Only the party leader can disband the party.' }
    }

    // Delete the party — party_members cascade via ON DELETE CASCADE
    const { error: partyError } = await supabase
        .from('parties')
        .delete()
        .eq('id', partyId)

    if (partyError) {
        return { success: false, error: 'Failed to delete party.' }
    }

    return { success: true }
}

/**
 * Leave a party (non-leader members only).
 */
export async function leaveParty(userId: string, partyId: string): Promise<{ success: boolean, error?: string }> {
    const supabase = createClient()

    const { data: member } = await supabase
        .from('party_members')
        .select('role')
        .eq('party_id', partyId)
        .eq('user_id', userId)
        .single()

    if (!member) {
        return { success: false, error: 'You are not in this party.' }
    }

    if (member.role === 'leader') {
        return { success: false, error: 'The leader cannot leave. Disband the party instead.' }
    }

    const { error } = await supabase
        .from('party_members')
        .delete()
        .eq('party_id', partyId)
        .eq('user_id', userId)

    if (error) {
        return { success: false, error: 'Failed to leave party.' }
    }

    return { success: true }
}

/**
 * Saves a workout and updates all related user stats (XP, level, attributes, raid damage).
 */
export interface BattleLogEntry {
    exerciseName: string
    sets: number
    reps: number
    weight: number
    volume: number
    isPR: boolean
    exerciseType: string
}

export interface WorkoutResult {
    success: boolean
    achievements: Achievement[]
    oldLevel: number
    newLevel: number
    xpEarned: number
    streakCount: number
    ironScrapsEarned: number
    battleLog: BattleLogEntry[]
    totalVolume: number
}

export async function saveWorkoutSession(
    workout: WorkoutInsert,
    sets: WorkoutSetInsert[],
    exerciseTypes: Map<string, string>, // exercise_id -> exercise_type
    userId: string,
    userClassName?: string | null
): Promise<WorkoutResult> {
    const emptyResult: WorkoutResult = {
        success: false, achievements: [], oldLevel: 1, newLevel: 1,
        xpEarned: 0, streakCount: 0, ironScrapsEarned: 0, battleLog: [], totalVolume: 0
    }
    const supabase = createClient()

    // Insert Workout
    const { data: insertedWorkout, error: workoutError } = await supabase
        .from('workouts')
        .insert(workout)
        .select()
        .single()

    if (workoutError || !insertedWorkout) {
        console.error('Error saving workout:', workoutError)
        return emptyResult
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
        return emptyResult
    }

    // Build battle log from the sets we just saved
    const exerciseNameMap = new Map<string, string>()
    // We need exercise names - fetch them
    const exerciseIds = [...new Set(sets.map(s => s.exercise_id))]
    const { data: exerciseData } = await supabase
        .from('exercises')
        .select('id, name')
        .in('id', exerciseIds)
    for (const ex of (exerciseData || [])) {
        exerciseNameMap.set(ex.id, ex.name)
    }

    // Group sets by exercise for battle log
    const exerciseGroups = new Map<string, { sets: number, totalReps: number, maxWeight: number, totalVolume: number, isPR: boolean, exerciseType: string }>()
    for (const set of sets) {
        const exId = set.exercise_id
        const exType = exerciseTypes.get(exId) || 'Strength'
        const existing = exerciseGroups.get(exId) || { sets: 0, totalReps: 0, maxWeight: 0, totalVolume: 0, isPR: false, exerciseType: exType }
        existing.sets += 1
        const w = Number(set.weight) || 0
        const r = Number(set.reps) || 0
        existing.totalReps += r
        existing.maxWeight = Math.max(existing.maxWeight, w)
        existing.totalVolume += w * r
        if (set.is_pr) existing.isPR = true
        exerciseGroups.set(exId, existing)
    }

    const battleLog: BattleLogEntry[] = []
    for (const [exId, data] of exerciseGroups) {
        battleLog.push({
            exerciseName: exerciseNameMap.get(exId) || 'Unknown',
            sets: data.sets,
            reps: data.totalReps,
            weight: data.maxWeight,
            volume: data.totalVolume,
            isPR: data.isPR,
            exerciseType: data.exerciseType,
        })
    }

    // Calculate XP using the real XP engine
    const consistency = await getConsistencyContext(userId)

    const xpSets = sets.map(set => {
        const exType = exerciseTypes.get(set.exercise_id) || 'Strength'

        // Determine class specialty
        const isSpecialty = determineClassSpecialty(userClassName, exType)

        let type: 'Strength' | 'Cardio' | 'Bodyweight' = 'Cardio'
        let data: WorkoutSet

        if (exType === 'Bodyweight') {
            type = 'Bodyweight'
            data = { reps: set.reps || undefined, rpe: set.rpe || undefined }
        } else if (exType === 'Strength') {
            type = 'Strength'
            data = { weight: set.weight || undefined, reps: set.reps || undefined, rpe: set.rpe || undefined }
        } else {
            data = { durationMinutes: set.reps || undefined, rpe: set.rpe || undefined }
        }

        return { type, data, isSpecialty }
    })

    let xpEarned = calculateSessionXP(xpSets, consistency)

    // Apply equipment bonuses
    const equippedEffects = await getEquippedEffects(userId)
    if (equippedEffects.xpBonusFlat > 0) {
        if (equippedEffects.xpBonusFlat < 1) {
            xpEarned = Math.round(xpEarned * (1 + equippedEffects.xpBonusFlat))
        } else {
            xpEarned += Math.round(equippedEffects.xpBonusFlat)
        }
    }

    // Update the workout record with real XP
    await supabase
        .from('workouts')
        .update({ xp_earned: xpEarned })
        .eq('id', insertedWorkout.id)

    // Update user stats
    let strVolume = 0
    let dexMinutes = 0
    let wisMinutes = 0
    let conSets = sets.length

    for (const set of sets) {
        const exType = exerciseTypes.get(set.exercise_id) || 'Strength'
        if (exType === 'Strength') {
            strVolume += (set.weight || 0) * (set.reps || 0)
        } else if (exType === 'Bodyweight') {
            strVolume += (set.reps || 0) * 2 // bodyweight reps contribute to str volume
        } else if (exType === 'Recovery') {
            wisMinutes += (set.reps || 0)
        } else {
            dexMinutes += (set.reps || 0) // reps stores duration for cardio
        }
    }

    // Fetch current user data to compute new level + streak
    const { data: currentUser } = await supabase
        .from('users')
        .select('xp_current, level, str_volume_lifetime, dex_minutes_lifetime, con_sets_lifetime, wis_minutes_lifetime, current_streak, last_workout_date, iron_scraps, best_streak')
        .eq('id', userId)
        .single()

    let oldLevel = 1
    let newLevel = 1
    let streakCount = 0
    let ironScrapsEarned = 0

    if (currentUser) {
        oldLevel = currentUser.level || 1
        const newXpCurrent = (currentUser.xp_current || 0) + xpEarned
        const newStrVolume = (currentUser.str_volume_lifetime || 0) + strVolume
        const newDexMinutes = (currentUser.dex_minutes_lifetime || 0) + dexMinutes
        const newConSets = (currentUser.con_sets_lifetime || 0) + conSets
        const newWisMinutes = (currentUser.wis_minutes_lifetime || 0) + wisMinutes

        newLevel = calculateLevelFromXP(newXpCurrent)

        // --- Streak Logic ---
        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
        const lastDate = currentUser.last_workout_date // already a date string or null
        let newStreak = currentUser.current_streak || 0

        if (lastDate === today) {
            // Already worked out today, no streak change
        } else if (lastDate) {
            const lastDateObj = new Date(lastDate + 'T00:00:00')
            const todayObj = new Date(today + 'T00:00:00')
            const diffDays = Math.round((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24))
            if (diffDays === 1) {
                newStreak += 1
            } else {
                newStreak = 1 // Gap > 1 day, reset
            }
        } else {
            newStreak = 1 // First workout ever
        }

        streakCount = newStreak
        const newBestStreak = Math.max(newStreak, (currentUser as any).best_streak || 0)

        // --- Iron Scraps: earn 10 per workout + 5 per streak day (bonus) ---
        ironScrapsEarned = 10 + Math.min(newStreak, 10) * 5
        if (equippedEffects.ironScrapsBonus > 0) {
            ironScrapsEarned = Math.round(ironScrapsEarned * (1 + equippedEffects.ironScrapsBonus))
        }

        await supabase
            .from('users')
            .update({
                xp_current: newXpCurrent,
                level: newLevel,
                str_volume_lifetime: newStrVolume,
                dex_minutes_lifetime: newDexMinutes,
                con_sets_lifetime: newConSets,
                wis_minutes_lifetime: newWisMinutes,
                current_streak: newStreak,
                best_streak: newBestStreak,
                last_workout_date: today,
                iron_scraps: (currentUser.iron_scraps || 0) + ironScrapsEarned,
            })
            .eq('id', userId)
    }

    // Record raid damage if user is in an active raid
    const { data: memberData } = await supabase
        .from('party_members')
        .select('party_id')
        .eq('user_id', userId)
        .maybeSingle()

    if (memberData) {
        const { data: activeRaid } = await supabase
            .from('raids')
            .select('id, boss_max_hp, shield_type, shield_hp, shield_hp_current, boss_weakness, boss_resistance')
            .eq('party_id', memberData.party_id)
            .eq('status', 'active')
            .single()

        if (activeRaid) {
            let physicalDmg = strVolume
            let cardioDmg = 0
            let magicDmg = 0

            for (const set of sets) {
                const exType = exerciseTypes.get(set.exercise_id) || 'Strength'
                if (exType === 'Recovery') {
                    magicDmg += (set.reps || 0) * 30
                } else if (exType !== 'Strength' && (set.rpe || 0) >= 8) {
                    cardioDmg += (set.reps || 0) * 50
                }
            }

            // Apply equipment raid damage bonus
            if (equippedEffects.raidDamageBonus > 0) {
                physicalDmg = Math.round(physicalDmg * (1 + equippedEffects.raidDamageBonus))
                cardioDmg = Math.round(cardioDmg * (1 + equippedEffects.raidDamageBonus))
                magicDmg = Math.round(magicDmg * (1 + equippedEffects.raidDamageBonus))
            }

            // Apply weakness/resistance multipliers
            const applyMultiplier = (dmg: number, type: string) => {
                if (activeRaid.boss_weakness === type) return Math.round(dmg * 2)
                if (activeRaid.boss_resistance === type) return Math.round(dmg * 0.5)
                return dmg
            }

            physicalDmg = applyMultiplier(physicalDmg, 'physical')
            cardioDmg = applyMultiplier(cardioDmg, 'cardio')
            magicDmg = applyMultiplier(magicDmg, 'magic')

            const damageRecords: { raid_id: string, user_id: string, workout_id: string, damage: number, damage_type: string }[] = []
            if (physicalDmg > 0) damageRecords.push({ raid_id: activeRaid.id, user_id: userId, workout_id: insertedWorkout.id, damage: physicalDmg, damage_type: 'physical' })
            if (cardioDmg > 0) damageRecords.push({ raid_id: activeRaid.id, user_id: userId, workout_id: insertedWorkout.id, damage: cardioDmg, damage_type: 'cardio' })
            if (magicDmg > 0) damageRecords.push({ raid_id: activeRaid.id, user_id: userId, workout_id: insertedWorkout.id, damage: magicDmg, damage_type: 'magic' })

            if (damageRecords.length > 0) {
                await supabase.from('raid_damage').insert(damageRecords)

                // Check total damage for boss defeat
                const { data: allDamage } = await supabase
                    .from('raid_damage')
                    .select('damage, damage_type')
                    .eq('raid_id', activeRaid.id)

                let totalDmg = 0
                let shieldDmg = 0

                const shieldDmgType = activeRaid.shield_type === 'swift' ? 'cardio' :
                    activeRaid.shield_type === 'arcane' ? 'magic' : 'physical'

                for (const d of (allDamage || [])) {
                    totalDmg += d.damage || 0
                    if (activeRaid.shield_type && d.damage_type === shieldDmgType) {
                        shieldDmg += d.damage || 0
                    }
                }

                // Update shield HP current
                if (activeRaid.shield_hp && activeRaid.shield_hp > 0) {
                    const newShieldHp = Math.max(0, (activeRaid.shield_hp) - shieldDmg)
                    await supabase.from('raids').update({ shield_hp_current: newShieldHp }).eq('id', activeRaid.id)
                }

                // Boss defeated when total damage >= max HP (and shield is broken if present)
                const shieldBroken = !activeRaid.shield_type || !activeRaid.shield_hp || shieldDmg >= activeRaid.shield_hp
                if (shieldBroken && totalDmg >= activeRaid.boss_max_hp) {
                    await supabase.from('raids').update({ status: 'defeated' }).eq('id', activeRaid.id)

                    // Award loot boxes to all contributing party members
                    const { data: contributors } = await supabase
                        .from('raid_damage')
                        .select('user_id')
                        .eq('raid_id', activeRaid.id)

                    const uniqueUsers = [...new Set((contributors || []).map(c => c.user_id))]
                    const lootBoxInserts = uniqueUsers.map(uid => ({ user_id: uid, source: 'raid' }))
                    if (lootBoxInserts.length > 0) {
                        // loot_boxes table may not exist yet, wrap in try-catch
                        try {
                            await (supabase as any).from('loot_boxes').insert(lootBoxInserts)
                        } catch (e) {
                            // Loot boxes not yet available, skip
                        }
                    }
                }
            }
        }
    }

    // Check and award achievements
    const newAchievements = await checkAndAwardAchievements(userId, {
        sessionVolume: strVolume,
        isComebackQuest: consistency.comebackQuest
    })

    return {
        success: true,
        achievements: newAchievements,
        oldLevel,
        newLevel,
        xpEarned,
        streakCount,
        ironScrapsEarned,
        battleLog,
        totalVolume: strVolume,
    }
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
        case 'Wizard':
            return exerciseType === 'Recovery' || exerciseType === 'Mobility'
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

/**
 * Fetches all shop items with user purchase status.
 */
export async function fetchShopItems(userId: string) {
    const supabase = createClient()

    const [{ data: items }, { data: purchases }] = await Promise.all([
        supabase.from('shop_items').select('*').order('cost', { ascending: true }),
        supabase.from('user_purchases').select('item_id').eq('user_id', userId),
    ])

    const ownedIds = new Set((purchases || []).map(p => p.item_id))

    return (items || []).map(item => ({
        ...item,
        owned: ownedIds.has(item.id),
    }))
}

/**
 * Purchase a shop item. Returns success/error.
 */
export async function purchaseShopItem(userId: string, itemId: string, cost: number): Promise<{ success: boolean, error?: string }> {
    const supabase = createClient()

    // Get current scraps
    const { data: userData } = await supabase
        .from('users')
        .select('iron_scraps')
        .eq('id', userId)
        .single()

    if (!userData || (userData.iron_scraps || 0) < cost) {
        return { success: false, error: 'Not enough Iron Scraps' }
    }

    // Deduct scraps
    const { error: updateError } = await supabase
        .from('users')
        .update({ iron_scraps: (userData.iron_scraps || 0) - cost })
        .eq('id', userId)

    if (updateError) return { success: false, error: 'Failed to deduct scraps' }

    // Record purchase
    const { error: purchaseError } = await supabase
        .from('user_purchases')
        .insert({ user_id: userId, item_id: itemId })

    if (purchaseError) {
        // Refund on failure
        await supabase.from('users').update({ iron_scraps: userData.iron_scraps }).eq('id', userId)
        return { success: false, error: 'Purchase failed' }
    }

    return { success: true }
}

/**
 * Equip or unequip a shop item.
 */
export async function equipShopItem(userId: string, type: 'title' | 'frame', value: string | null): Promise<boolean> {
    const supabase = createClient()
    const update = type === 'title' ? { equipped_title: value } : { equipped_frame: value }
    const { error } = await supabase.from('users').update(update).eq('id', userId)
    return !error
}

// --- Equipment System ---
// Note: equipment/user_equipment/loot_boxes/loot_box_contents tables are not yet in generated types,
// so we use (supabase as any) for those tables.

export async function fetchUserEquipment(userId: string) {
    const supabase = createClient()
    const { data, error } = await (supabase as any)
        .from('user_equipment')
        .select('*, equipment(*)')
        .eq('user_id', userId)
        .order('obtained_at', { ascending: false })
    if (error) { console.error('Error fetching equipment:', error); return [] }
    return data || []
}

export async function fetchShopEquipment() {
    const supabase = createClient()
    const { data } = await (supabase as any)
        .from('equipment')
        .select('*')
        .not('cost', 'is', null)
        .order('cost', { ascending: true })
    return data || []
}

export async function equipItem(userId: string, userEquipmentId: string, slot: string): Promise<boolean> {
    const supabase = createClient()
    await (supabase as any).from('user_equipment').update({ equipped_slot: null }).eq('user_id', userId).eq('equipped_slot', slot)
    const { error } = await (supabase as any).from('user_equipment').update({ equipped_slot: slot }).eq('id', userEquipmentId).eq('user_id', userId)
    return !error
}

export async function unequipItem(userId: string, userEquipmentId: string): Promise<boolean> {
    const supabase = createClient()
    const { error } = await (supabase as any).from('user_equipment').update({ equipped_slot: null }).eq('id', userEquipmentId).eq('user_id', userId)
    return !error
}

export async function purchaseEquipment(userId: string, equipmentId: string, cost: number): Promise<{ success: boolean, error?: string }> {
    const supabase = createClient()
    const { data: userData } = await supabase.from('users').select('iron_scraps').eq('id', userId).single()
    if (!userData || (userData.iron_scraps || 0) < cost) return { success: false, error: 'Not enough Iron Scraps' }

    const { count } = await (supabase as any).from('user_equipment').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('equipment_id', equipmentId)
    if ((count || 0) > 0) return { success: false, error: 'Already owned' }

    const { error: updateErr } = await supabase.from('users').update({ iron_scraps: (userData.iron_scraps || 0) - cost }).eq('id', userId)
    if (updateErr) return { success: false, error: 'Failed to deduct scraps' }

    const { error: insertErr } = await (supabase as any).from('user_equipment').insert({ user_id: userId, equipment_id: equipmentId, source: 'shop' })
    if (insertErr) {
        await supabase.from('users').update({ iron_scraps: userData.iron_scraps }).eq('id', userId)
        return { success: false, error: 'Failed to add item' }
    }
    return { success: true }
}

export async function fetchLootBoxes(userId: string) {
    const supabase = createClient()
    const { data } = await (supabase as any).from('loot_boxes').select('*, loot_box_contents(*, equipment(*))').eq('user_id', userId).order('created_at', { ascending: false })
    return data || []
}

export async function openLootBox(userId: string, lootBoxId: string): Promise<any> {
    const supabase = createClient()
    const { data: allGear } = await (supabase as any).from('equipment').select('id, rarity')
    if (!allGear || allGear.length === 0) return null

    const weights: Record<string, number> = { common: 50, rare: 30, epic: 15, legendary: 5 }
    const weighted = allGear.flatMap((g: any) => Array(weights[g.rarity] || 10).fill(g))
    const pick = weighted[Math.floor(Math.random() * weighted.length)]

    await (supabase as any).from('loot_box_contents').insert({ loot_box_id: lootBoxId, equipment_id: pick.id })
    await (supabase as any).from('loot_boxes').update({ opened: true }).eq('id', lootBoxId)
    await (supabase as any).from('user_equipment').insert({ user_id: userId, equipment_id: pick.id, source: 'raid_drop' })

    const { data: gear } = await (supabase as any).from('equipment').select('*').eq('id', pick.id).single()
    return gear
}

export async function getEquippedEffects(userId: string) {
    const supabase = createClient()
    const { data } = await (supabase as any)
        .from('user_equipment')
        .select('equipped_slot, equipment(*)')
        .eq('user_id', userId)
        .not('equipped_slot', 'is', null)

    const effects = {
        xpBonusFlat: 0,
        xpBonusByExercise: new Map<string, number>(),
        xpBonusByCategory: new Map<string, number>(),
        raidDamageBonus: 0,
        ironScrapsBonus: 0,
    }

    for (const item of (data || [])) {
        const eq = Array.isArray(item.equipment) ? item.equipment[0] : item.equipment
        if (!eq) continue
        switch ((eq as any).effect_type) {
            case 'xp_bonus_flat':
                effects.xpBonusFlat += Number((eq as any).effect_value) || 0
                break
            case 'xp_bonus_exercise':
                if ((eq as any).effect_target) {
                    const existing = effects.xpBonusByExercise.get((eq as any).effect_target) || 0
                    effects.xpBonusByExercise.set((eq as any).effect_target, existing + Number((eq as any).effect_value))
                }
                break
            case 'xp_bonus_category':
                if ((eq as any).effect_target) {
                    const existing = effects.xpBonusByCategory.get((eq as any).effect_target) || 0
                    effects.xpBonusByCategory.set((eq as any).effect_target, existing + Number((eq as any).effect_value))
                }
                break
            case 'raid_damage_bonus':
                effects.raidDamageBonus += Number((eq as any).effect_value) || 0
                break
            case 'iron_scraps_bonus':
                effects.ironScrapsBonus += Number((eq as any).effect_value) || 0
                break
        }
    }
    return effects
}

// --- Skill Tree System ---

/**
 * Calculates how many skill points a user has earned based on level.
 * 1 point at levels: 10, 15, 20, 25, 30, 35, 40, 45, 50, then every 10 after.
 */
export function getAvailableSkillPoints(level: number): number {
    const milestones = [10, 15, 20, 25, 30, 35, 40, 45, 50]
    let points = milestones.filter(m => level >= m).length
    if (level > 50) {
        points += Math.floor((level - 50) / 10)
    }
    return points
}

/**
 * Fetches skill tree nodes for a class and user's allocated points.
 */
export async function fetchSkillTree(userId: string, className: string) {
    const supabase = createClient()

    const [{ data: nodes }, { data: allocated }] = await Promise.all([
        (supabase as any).from('skill_tree_nodes').select('*').eq('class_name', className).order('branch').order('tier'),
        (supabase as any).from('user_skill_points').select('node_id').eq('user_id', userId),
    ])

    const allocatedIds = new Set<string>((allocated || []).map((a: any) => a.node_id as string))

    return {
        nodes: nodes || [],
        allocatedIds,
        totalAllocated: allocatedIds.size,
    }
}

/**
 * Allocates a skill point to a node (validates prerequisites).
 */
export async function allocateSkillPoint(userId: string, nodeId: string, className: string): Promise<{ success: boolean, error?: string }> {
    const supabase = createClient()

    // Fetch user level
    const { data: userData } = await supabase.from('users').select('level').eq('id', userId).single()
    if (!userData) return { success: false, error: 'User not found' }

    // Check available points
    const available = getAvailableSkillPoints(userData.level || 1)
    const { count: usedPoints } = await (supabase as any)
        .from('user_skill_points')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    if ((usedPoints || 0) >= available) return { success: false, error: 'No skill points available' }

    // Get the target node
    const { data: targetNode } = await (supabase as any)
        .from('skill_tree_nodes')
        .select('*')
        .eq('id', nodeId)
        .single()

    if (!targetNode) return { success: false, error: 'Node not found' }
    if (targetNode.class_name !== className) return { success: false, error: 'Wrong class' }

    // Check prerequisite: must have tier N-1 in same branch
    if (targetNode.tier > 1) {
        const { data: prereqNode } = await (supabase as any)
            .from('skill_tree_nodes')
            .select('id')
            .eq('class_name', className)
            .eq('branch', targetNode.branch)
            .eq('tier', targetNode.tier - 1)
            .single()

        if (prereqNode) {
            const { count: hasPrereq } = await (supabase as any)
                .from('user_skill_points')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('node_id', prereqNode.id)

            if (!hasPrereq || hasPrereq === 0) {
                return { success: false, error: 'Prerequisite not met — unlock the previous tier first' }
            }
        }
    }

    // Allocate
    const { error } = await (supabase as any)
        .from('user_skill_points')
        .insert({ user_id: userId, node_id: nodeId })

    if (error) return { success: false, error: 'Already allocated or error' }
    return { success: true }
}

// --- WOD Templates ---

export type WodMovement = {
    exercise_name: string
    reps: number
    weight_lbs: number | null
    notes: string
}

export type WodTemplate = {
    id: string
    name: string
    wod_type: 'amrap' | 'emom' | 'for_time' | 'chipper' | 'tabata'
    time_cap_seconds: number | null
    rounds: number | null
    is_benchmark: boolean
    created_by: string | null
    movements: WodMovement[]
    created_at: string
}

export async function fetchBenchmarkWods(): Promise<WodTemplate[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('wod_templates')
        .select('*')
        .eq('is_benchmark', true)
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching benchmark WODs:', error)
        return []
    }
    return (data || []) as WodTemplate[]
}

export async function fetchUserWods(userId: string): Promise<WodTemplate[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('wod_templates')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching user WODs:', error)
        return []
    }
    return (data || []) as WodTemplate[]
}

export async function createCustomWod(wod: {
    name: string
    wod_type: string
    time_cap_seconds: number | null
    rounds: number | null
    created_by: string
    movements: WodMovement[]
}): Promise<WodTemplate | null> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('wod_templates')
        .insert({
            ...wod,
            is_benchmark: false,
            movements: wod.movements as any
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating custom WOD:', error)
        return null
    }
    return data as WodTemplate
}

export async function deleteCustomWod(wodId: string): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase
        .from('wod_templates')
        .delete()
        .eq('id', wodId)

    if (error) {
        console.error('Error deleting WOD:', error)
        return false
    }
    return true
}
