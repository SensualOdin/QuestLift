"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, Trophy, Zap, Swords, Flame } from "lucide-react"
import { useUserStore } from "@/lib/store/user-store"
import { fetchUserParty } from "@/lib/supabase/data-hooks"
import { useRealtimePartyActivity } from "@/lib/supabase/realtime-hooks"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow, parseISO } from "date-fns"

interface ActivityItem {
    id: string
    type: 'workout' | 'pr' | 'level_up' | 'raid_damage'
    userName: string
    message: string
    detail?: string
    timestamp: string
}

export function PartyActivityFeed() {
    const { user } = useUserStore()
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)
    const [partyId, setPartyId] = useState<string | null>(null)

    const loadFeed = async () => {
        if (!user) return

        const partyData = await fetchUserParty(user.id)
        if (!partyData) {
            setLoading(false)
            return
        }

        const pId = (Array.isArray(partyData.party) ? partyData.party[0] : partyData.party)?.id
        if (!pId) {
            setLoading(false)
            return
        }
        setPartyId(pId)
        const partyId = pId

        const supabase = createClient()

        // Get all party member IDs
        const { data: members } = await supabase
            .from('party_members')
            .select('user_id, users(display_name)')
            .eq('party_id', partyId)

        if (!members || members.length === 0) {
            setLoading(false)
            return
        }

        const memberIds = members.map(m => m.user_id)
        const nameMap = new Map<string, string>()
        for (const m of members) {
            const u = Array.isArray(m.users) ? m.users[0] : m.users
            nameMap.set(m.user_id, u?.display_name || 'Unknown')
        }

        // Fetch recent workouts from all party members
        const { data: workouts } = await supabase
            .from('workouts')
            .select('id, user_id, total_volume, xp_earned, start_time')
            .in('user_id', memberIds)
            .order('start_time', { ascending: false })
            .limit(15)

        const feed: ActivityItem[] = []

        for (const w of (workouts || [])) {
            const name = nameMap.get(w.user_id) || 'Unknown'
            const isYou = w.user_id === user.id

            feed.push({
                id: `workout-${w.id}`,
                type: 'workout',
                userName: isYou ? 'You' : name,
                message: `completed a workout`,
                detail: `${((w.total_volume || 0) / 1000).toFixed(1)}k lbs lifted | +${w.xp_earned || 0} XP`,
                timestamp: w.start_time || new Date().toISOString()
            })

            // Check for PRs in this workout
            const { data: prSets } = await supabase
                .from('workout_sets')
                .select('weight, exercises(name)')
                .eq('workout_id', w.id)
                .eq('is_pr', true)

            if (prSets && prSets.length > 0) {
                for (const pr of prSets) {
                    const exName = (pr.exercises as any)?.name || 'an exercise'
                    feed.push({
                        id: `pr-${w.id}-${exName}`,
                        type: 'pr',
                        userName: isYou ? 'You' : name,
                        message: `set a new PR on ${exName}`,
                        detail: `${pr.weight} lbs`,
                        timestamp: w.start_time || new Date().toISOString()
                    })
                }
            }
        }

        // Sort by timestamp descending
        feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        setActivities(feed.slice(0, 20))
        setLoading(false)
    }

    useEffect(() => {
        loadFeed()
    }, [user])

    // Live updates when party members log workouts
    useRealtimePartyActivity(partyId, loadFeed)

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'pr': return { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
            case 'level_up': return { icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10' }
            case 'raid_damage': return { icon: Swords, color: 'text-red-400', bg: 'bg-red-500/10' }
            default: return { icon: Dumbbell, color: 'text-indigo-400', bg: 'bg-indigo-500/10' }
        }
    }

    if (loading) {
        return (
            <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl">
                <CardHeader><Skeleton className="h-6 w-1/3 bg-slate-800" /></CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full bg-slate-800 rounded-xl" />)}
                </CardContent>
            </Card>
        )
    }

    if (activities.length === 0) {
        return (
            <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-400" />
                        Party Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-400 italic text-center py-6">
                        No party activity yet. Be the first to log a workout!
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader className="pb-3 border-b border-slate-800/60">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    Party Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {activities.map(activity => {
                        const config = getActivityIcon(activity.type)
                        const Icon = config.icon
                        let timeAgo = 'recently'
                        try {
                            timeAgo = formatDistanceToNow(parseISO(activity.timestamp), { addSuffix: true })
                        } catch {}

                        return (
                            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/40 hover:bg-slate-900/60 transition-colors">
                                <div className={`p-2 rounded-lg ${config.bg} ${config.color} flex-shrink-0 mt-0.5`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-200">
                                        <span className="font-semibold text-white">{activity.userName}</span>{' '}
                                        {activity.message}
                                    </p>
                                    {activity.detail && (
                                        <p className="text-xs text-slate-400 mt-0.5">{activity.detail}</p>
                                    )}
                                </div>
                                <span className="text-xs text-slate-600 flex-shrink-0 mt-1">{timeAgo}</span>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
