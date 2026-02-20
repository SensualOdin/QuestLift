"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target, Swords, Timer } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchActiveQuests, type Quest } from "@/lib/supabase/data-hooks"
import { useUserStore } from "@/lib/store/user-store"
import { Skeleton } from "@/components/ui/skeleton"

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

    // UI Mapping configurations based on Quest Type
    const getQuestUIConfig = (type: string) => {
        switch (type) {
            case 'raid':
                return { icon: Swords, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" }
            case 'daily':
                return { icon: Timer, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" }
            default: // weekly
                return { icon: Target, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" }
        }
    }

    if (loading) {
        return (
            <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl h-48">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-400" />
                        Active Quests
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-24 w-full bg-slate-800 rounded-2xl" />
                </CardContent>
            </Card>
        )
    }

    if (quests.length === 0) {
        return (
            <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-400" />
                        Active Quests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-500 italic text-center py-4">No active quests found. Go rest at the inn.</p>
                </CardContent>
            </Card>
        )
    }
    return (
        <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-400" />
                    Active Quests
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quests.map((quest) => {
                    const uiConfig = getQuestUIConfig(quest.type)
                    const Icon = uiConfig.icon
                    return (
                        <div key={quest.id} className={`p-4 rounded-2xl border ${uiConfig.border} bg-slate-950/50 flex flex-col justify-between group hover:bg-slate-900/80 transition-colors`}>
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className={`p-2 rounded-xl ${uiConfig.bg} ${uiConfig.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-500">
                                        {Math.round((quest.progress / quest.total) * 100)}%
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-200">{quest.title}</h4>
                                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{quest.description}</p>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <Progress value={(quest.progress / quest.total) * 100} className="h-1.5 bg-slate-800" />
                                <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                    <span>Progress</span>
                                    <span>{quest.progress.toLocaleString()} / {quest.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
