import { createClient } from './client'
import type { Database } from '../supabase-types'

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
                id, weight, reps, rpe, set_order,
                exercises (
                    name, equipment
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
    // Placeholder for real quest engine logic
    // In a real app, this would check activity logs against weekly parameters 
    // and pull live raid damage from `raid_damage`. 
    // We will return the structure needed by the UI for now.
    return [
        {
            id: 'weekly-1',
            title: 'Weekly Warrior',
            description: 'Complete 4 workouts this week to earn the Warrior title.',
            progress: 0,
            total: 4,
            type: 'weekly'
        }
    ]
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
        .select('user_id, users(display_name, class_name, level)')
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

export async function saveWorkoutSession(workout: WorkoutInsert, sets: WorkoutSetInsert[]): Promise<boolean> {
    const supabase = createClient()

    // Insert Workout
    const { data: insertedWorkout, error: workoutError } = await supabase
        .from('workouts')
        .insert(workout)
        .select()
        .single()

    if (workoutError || !insertedWorkout) {
        console.error('Error saving workout:', workoutError)
        return false
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
        return false
    }

    return true
}
