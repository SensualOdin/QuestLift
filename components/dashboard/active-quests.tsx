"use client"

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GameCard } from "@/components/ui/game-card"
import { Progress } from "@/components/ui/progress"
import { Target, Swords, Timer, CheckCircle2, Coins, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchActiveQuests, type Quest } from "@/lib/supabase/data-hooks"
import { useUserStore } from "@/lib/store/user-store"
import { Skeleton } from "@/components/ui/skeleton"

function getResetLabel(type: string): string {
    const now = new Date()
    if (type === 'daily') {
        const hoursLeft = 23 - now.getHours()
        const minsLeft = 59 - now.getMinutes()
        if (hoursLeft === 0) return `${minsLeft}m`
        return `${hoursLeft}h ${minsLeft}m`
    }
    if (type === 'weekly') {
        const dayOfWeek = now.getDay()
        // Days until next Monday (1)
        const daysLeft = dayOfWeek === 0 ? 1 : (8 - dayOfWeek)
        if (daysLeft === 1) return 'Tomorrow'
        return `${daysLeft}d`
    }
    return ''
}

export function ActiveQuests() {
    const { user } = useUserStore()
    const [quests, setQuests] = useState<Quest[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadQuests = async () => {
            if (user?.id) {
                const data = await fetchActiveQuests(user.id)
                setQuests(data)
                setLoading(false)
            }
        }
        loadQuests()
    }, [user])

    const getQuestUIConfig = (type: string, completed?: boolean) => {
        if (completed) {
            return { icon: CheckCircle2, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" }
        }
        switch (type) {
            case 'raid':
                return { icon: Swords, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" }
            case 'daily':
                return { icon: Timer, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" }
            default:
                return { icon: Target, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" }
        }
    }

    if (loading) {
        return (
            <GameCard withTopAccent className="h-48">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 font-cinzel">
                        <Target className="w-5 h-5 text-indigo-400" />
                        Active Quests
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-24 w-full bg-slate-800 rounded-2xl" />
                </CardContent>
            </GameCard>
        )
    }

    if (quests.length === 0) {
        return (
            <GameCard withTopAccent>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 font-cinzel">
                        <Target className="w-5 h-5 text-indigo-400" />
                        Active Quests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-400 italic text-center py-4">No active quests found. Go rest at the inn.</p>
                </CardContent>
            </GameCard>
        )
    }

    return (
        <GameCard withTopAccent>
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 font-cinzel">
                    <Target className="w-5 h-5 text-indigo-400" />
                    Active Quests
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quests.map((quest) => {
                    const uiConfig = getQuestUIConfig(quest.type, quest.completed)
                    const Icon = uiConfig.icon
                    const resetLabel = getResetLabel(quest.type)

                    return (
                        <div key={quest.id} className={`p-4 rounded-2xl border ${uiConfig.border} ${quest.completed ? 'bg-amber-500/5' : 'bg-slate-950/50'} flex flex-col justify-between group hover:bg-slate-900/80 transition-colors`}>
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className={`p-2 rounded-xl ${uiConfig.bg} ${uiConfig.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {quest.reward && (
                                            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-400/70">
                                                <Coins className="w-3 h-3" /> {quest.reward}
                                            </span>
                                        )}
                                        {quest.completed ? (
                                            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Done</span>
                                        ) : (
                                            <span className="text-xs font-medium text-slate-400">
                                                {Math.round((quest.progress / quest.total) * 100)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h4 className={`font-medium ${quest.completed ? 'text-amber-300' : 'text-slate-200'}`}>{quest.title}</h4>
                                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{quest.description}</p>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                {quest.completed ? (
                                    <div className="h-1.5 w-full rounded-full bg-amber-400/30 overflow-hidden">
                                        <div className="h-full w-full bg-amber-400 rounded-full" />
                                    </div>
                                ) : (
                                    <Progress value={(quest.progress / quest.total) * 100} className="h-1.5 bg-slate-800" />
                                )}
                                <div className="flex justify-between text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                                    {resetLabel ? (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" />
                                            Resets in {resetLabel}
                                        </span>
                                    ) : (
                                        <span>Progress</span>
                                    )}
                                    <span>{quest.progress.toLocaleString()} / {quest.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </GameCard>
    )
}
