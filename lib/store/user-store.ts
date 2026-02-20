import { create } from 'zustand'
import { createClient } from '../supabase/client'
import type { Database } from '../supabase-types'

type Profile = Database['public']['Tables']['users']['Row']

interface RootState {
    user: Profile | null
    isLoading: boolean
    error: string | null
    fetchProfile: (userId: string) => Promise<void>
    refreshProfile: () => Promise<void>
}

export const useUserStore = create<RootState>((set, get) => ({
    user: null,
    isLoading: false,
    error: null,

    fetchProfile: async (userId: string) => {
        set({ isLoading: true, error: null })
        const supabase = createClient()

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) throw error
            set({ user: data, isLoading: false })
        } catch (err: any) {
            console.error('Error fetching user profile:', err)
            set({ error: err.message, isLoading: false })
        }
    },

    refreshProfile: async () => {
        const { user } = get()
        if (user?.id) {
            await get().fetchProfile(user.id)
        }
    }
}))
