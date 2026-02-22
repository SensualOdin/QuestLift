"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Scroll, CheckCircle2, Sparkles, Clock, Hammer } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchActiveBounties, type Bounty } from "@/lib/supabase/data-hooks"
import { useUserStore } from "@/lib/store/user-store"

function getResetHours(): string {
    const now = new Date()
    const hoursLeft = 23 - now.getHours()
    const minsLeft = 59 - now.getMinutes()
    if (hoursLeft === 0) return `${minsLeft}m`
    return `${hoursLeft}h ${minsLeft}m`
}

export function AdventurersGuild() {
    const { user } = useUserStore()
    const [bounties, setBounties] = useState<Bounty[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            if (user?.id) {
                const data = await fetchActiveBounties(user.id)
                setBounties(data)
                setLoading(false)
            }
        }
        load()
    }, [user])

    if (loading) {
        return (
            <Card className="border-amber-900/40 bg-gradient-to-br from-slate-900/80 to-amber-950/20 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Scroll className="w-5 h-5 text-amber-400" />
                        <span className="text-amber-200">Adventurer&apos;s Guild</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-28 w-full bg-amber-900/20 rounded-2xl" />
                    <Skeleton className="h-28 w-full bg-amber-900/20 rounded-2xl" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-amber-900/40 bg-gradient-to-br from-slate-900/80 to-amber-950/20 backdrop-blur-xl">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Scroll className="w-5 h-5 text-amber-400" />
                        <span className="text-amber-200">Adventurer&apos;s Guild</span>
                    </CardTitle>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
                        <Clock className="w-2.5 h-2.5" />
                        Resets in {getResetHours()}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {bounties.map((bounty) => {
                    const pct = bounty.total > 0 ? Math.round((bounty.progress / bounty.total) * 100) : 0

                    return (
                        <div
                            key={bounty.id}
                            className={`p-4 rounded-2xl border transition-colors ${
                                bounty.completed
                                    ? "border-emerald-500/30 bg-emerald-500/5"
                                    : "border-amber-800/30 bg-slate-950/50 hover:bg-slate-900/80"
                            }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-semibold text-sm ${bounty.completed ? "text-emerald-300" : "text-amber-200"}`}>
                                        {bounty.title}
                                    </h4>
                                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{bounty.description}</p>
                                </div>
                                {bounty.completed && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider ml-2 shrink-0">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Completed
                                    </span>
                                )}
                            </div>

                            <div className="mt-3 space-y-2">
                                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            bounty.completed ? "bg-emerald-400" : "bg-amber-500"
                                        }`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400/80">
                                            <Sparkles className="w-3 h-3" />
                                            {bounty.rewardXP} XP
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                                            <Hammer className="w-3 h-3" />
                                            {bounty.rewardScraps} Scraps
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-semibold">
                                        {bounty.progress.toLocaleString()} / {bounty.total.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {bounties.length === 0 && (
                    <p className="text-sm text-slate-500 italic text-center py-4">No bounties available today.</p>
                )}
            </CardContent>
        </Card>
    )
}
