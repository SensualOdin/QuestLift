"use client"

import { useEffect, useRef } from "react"
import { createClient } from "./client"

/**
 * Subscribe to party roster changes (members joining/leaving).
 * Calls onUpdate when party_members rows change for the given party.
 */
export function useRealtimePartyRoster(
    partyId: string | null | undefined,
    onUpdate: () => void
) {
    const onUpdateRef = useRef(onUpdate)
    onUpdateRef.current = onUpdate

    useEffect(() => {
        if (!partyId) return

        const supabase = createClient()
        const channel = supabase
            .channel(`party-roster-${partyId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "party_members",
                    filter: `party_id=eq.${partyId}`,
                },
                () => onUpdateRef.current()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [partyId])
}

/**
 * Subscribe to raid damage events for live boss HP updates.
 * Calls onUpdate when new damage is dealt to the given raid.
 */
export function useRealtimeRaidBoss(
    raidId: string | null | undefined,
    onUpdate: () => void
) {
    const onUpdateRef = useRef(onUpdate)
    onUpdateRef.current = onUpdate

    useEffect(() => {
        if (!raidId) return

        const supabase = createClient()
        const channel = supabase
            .channel(`raid-damage-${raidId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "raid_damage",
                    filter: `raid_id=eq.${raidId}`,
                },
                () => onUpdateRef.current()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [raidId])
}

/**
 * Subscribe to new workouts from any user (for party activity feed).
 * Calls onUpdate when any workout is inserted.
 */
export function useRealtimePartyActivity(
    partyId: string | null | undefined,
    onUpdate: () => void
) {
    const onUpdateRef = useRef(onUpdate)
    onUpdateRef.current = onUpdate

    useEffect(() => {
        if (!partyId) return

        const supabase = createClient()
        const channel = supabase
            .channel(`party-activity-${partyId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "workouts",
                },
                () => onUpdateRef.current()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [partyId])
}

/**
 * Subscribe to user profile updates (XP, level, stats).
 * Calls onUpdate when the user's row changes.
 */
export function useRealtimeUserProfile(
    userId: string | null | undefined,
    onUpdate: () => void
) {
    const onUpdateRef = useRef(onUpdate)
    onUpdateRef.current = onUpdate

    useEffect(() => {
        if (!userId) return

        const supabase = createClient()
        const channel = supabase
            .channel(`user-profile-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "users",
                    filter: `id=eq.${userId}`,
                },
                () => onUpdateRef.current()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId])
}
