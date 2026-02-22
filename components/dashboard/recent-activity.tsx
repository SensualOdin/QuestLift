"use client"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GameCard } from "@/components/ui/game-card"
import { Badge } from "@/components/ui/badge"
import { Activity, Dumbbell, Trophy } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchRecentActivity, type WorkoutActivity } from "@/lib/supabase/data-hooks"
import { useUserStore } from "@/lib/store/user-store"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"

export function RecentActivity() {
    const { user } = useUserStore()
    const [activities, setActivities] = useState<WorkoutActivity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadActivity = async () => {
            if (user?.id) {
                const data = await fetchRecentActivity(user.id)
                setActivities(data)
                setLoading(false)
            }
        }
        loadActivity()
    }, [user])

    if (loading) {
        return (
            <GameCard withTopAccent className="h-48">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 font-cinzel">
                        <Activity className="w-5 h-5 text-indigo-400" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-6 w-1/2 bg-slate-800 mb-4" />
                    <Skeleton className="h-4 w-1/3 bg-slate-800" />
                </CardContent>
            </GameCard>
        )
    }

    if (activities.length === 0) {
        return (
            <GameCard withTopAccent>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 font-cinzel">
                        <Activity className="w-5 h-5 text-indigo-400" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-500 italic text-center py-4">No recent activity. Time to hit the iron!</p>
                </CardContent>
            </GameCard>
        )
    }
    return (
        <GameCard withTopAccent>
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 font-cinzel">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative border-l border-slate-800 ml-3 space-y-8 pb-4">
                    {activities.map((activity, index) => (
                        <div key={activity.id} className="relative pl-6">
                            {/* Timeline dot */}
                            <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-slate-900 bg-indigo-500" />

                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-slate-200">{activity.name || 'Workout Session'}</h4>
                                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                                            {'Standard'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span>{activity.start_time ? formatDistanceToNow(new Date(activity.start_time), { addSuffix: true }) : 'Unknown'}</span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <span className="text-xs px-2 py-1 bg-slate-950 border border-slate-800 rounded-md text-slate-300">
                                            Volume: {activity.total_volume ? activity.total_volume.toLocaleString() : 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Reward pill */}
                                <div className="flex-shrink-0">
                                    {(activity.xp_earned ?? 0) > 0 && (
                                        <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20">
                                            +{activity.xp_earned} XP
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </GameCard>
    )
}
