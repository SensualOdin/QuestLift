"use client"

import { useEffect, useState } from "react"
import { useUserStore } from "@/lib/store/user-store"
import { createClient } from "@/lib/supabase/client"
import { OnboardingModal } from "./onboarding-modal"

export function OnboardingCheck() {
    const { user } = useUserStore()
    const [showOnboarding, setShowOnboarding] = useState(false)

    useEffect(() => {
        const checkNewUser = async () => {
            if (!user) return

            // Don't show if already completed onboarding
            if (localStorage.getItem(`questlift_onboarded_${user.id}`)) return

            // Show onboarding if user is level 1 and has no workouts
            if ((user.level || 1) > 1) return

            const supabase = createClient()
            const { count } = await supabase
                .from('workouts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)

            if ((count || 0) === 0) {
                setShowOnboarding(true)
            }
        }
        checkNewUser()
    }, [user])

    if (!user || !showOnboarding) return null

    return (
        <OnboardingModal
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            userId={user.id}
            currentName={user.display_name || ''}
        />
    )
}
