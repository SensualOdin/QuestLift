"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Sword, Shield, Flame, Star, Users, Dumbbell, Swords, RefreshCcw, Lock, Coins, Crown, Timer, Wind, Brain, Layers, Calendar } from "lucide-react"
import { useUserStore } from "@/lib/store/user-store"
import { fetchAllAchievements, type Achievement } from "@/lib/achievements"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

const ICON_MAP: Record<string, typeof Trophy> = {
    trophy: Trophy,
    sword: Sword,
    shield: Shield,
    flame: Flame,
    star: Star,
    users: Users,
    dumbbell: Dumbbell,
    swords: Swords,
    'refresh-ccw': RefreshCcw,
    crown: Crown,
    timer: Timer,
    wind: Wind,
    brain: Brain,
    layers: Layers,
    calendar: Calendar,
}

const CATEGORY_CONFIG: Record<string, { color: string, bg: string, border: string }> = {
    workout: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    progression: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    social: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    raid: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
}

export default function AchievementsPage() {
    const { user } = useUserStore()
    const [achievements, setAchievements] = useState<Achievement[]>([])
    const [earned, setEarned] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'prestige'>('all')
    const [equippingId, setEquippingId] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            if (!user?.id) return
            const data = await fetchAllAchievements(user.id)
            setAchievements(data.all)
            setEarned(data.earned)
            setLoading(false)
        }
        load()
    }, [user])

    const earnedCount = earned.size
    const totalCount = achievements.length

    const handleEquipTitle = async (achievement: Achievement) => {
        if (!user?.id) return
        setEquippingId(achievement.id)
        try {
            const supabase = createClient()
            await supabase
                .from('users')
                .update({ equipped_title: (achievement as any).reward_title })
                .eq('id', user.id)
        } finally {
            setEquippingId(null)
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">
                <Skeleton className="h-10 w-48 bg-slate-800" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Skeleton key={i} className="h-32 bg-slate-800 rounded-2xl" />
                    ))}
                </div>
            </div>
        )
    }

    // Filter achievements based on selected filter
    const filteredAchievements = filter === 'prestige'
        ? achievements.filter(a => !!(a as any).reward_title)
        : achievements

    // Group by category
    const grouped = filteredAchievements.reduce<Record<string, Achievement[]>>((acc, a) => {
        const cat = a.category || 'workout'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(a)
        return acc
    }, {})

    const categoryLabels: Record<string, string> = {
        workout: 'Workout',
        progression: 'Progression',
        social: 'Social',
        raid: 'Raid',
    }

    return (
        <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Achievement Hall
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        {earnedCount} / {totalCount} unlocked
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-500">{Math.round((earnedCount / Math.max(totalCount, 1)) * 100)}%</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Complete</div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all duration-700"
                    style={{ width: `${(earnedCount / Math.max(totalCount, 1)) * 100}%` }}
                />
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === 'all' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('prestige')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === 'prestige' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Prestige
                </button>
            </div>

            {/* Achievements by category */}
            {Object.entries(grouped).map(([category, achs]) => {
                const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.workout
                return (
                    <div key={category} className="space-y-4">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                            {categoryLabels[category] || category}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {achs.map(achievement => {
                                const isEarned = earned.has(achievement.id)
                                const Icon = ICON_MAP[achievement.icon] || Trophy
                                const hasRewardTitle = !!(achievement as any).reward_title
                                const isPrestige = hasRewardTitle

                                return (
                                    <Card
                                        key={achievement.id}
                                        className={`border transition-all ${
                                            isEarned && isPrestige
                                                ? `${config.border} bg-slate-900/60 shadow-lg shadow-[0_0_15px_rgba(234,179,8,0.3)]`
                                                : isEarned
                                                    ? `${config.border} bg-slate-900/60 shadow-lg`
                                                    : 'border-slate-800/40 bg-slate-950/40 opacity-60'
                                        }`}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <div className="relative flex-shrink-0">
                                                    {isEarned && (
                                                        <div className={`absolute inset-0 ${config.bg} rounded-xl blur-md opacity-50`} />
                                                    )}
                                                    <div className={`relative p-3 rounded-xl border ${
                                                        isEarned
                                                            ? `${config.bg} ${config.border} ${config.color}`
                                                            : 'bg-slate-900 border-slate-800 text-slate-600'
                                                    }`}>
                                                        {isEarned ? <Icon className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`font-bold text-sm ${isEarned ? 'text-white' : 'text-slate-500'}`}>
                                                        {achievement.name}
                                                    </h3>
                                                    <p className={`text-xs mt-0.5 ${isEarned ? 'text-slate-400' : 'text-slate-600'}`}>
                                                        {achievement.description}
                                                    </p>
                                                    {achievement.reward_scraps > 0 && (
                                                        <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${isEarned ? 'text-amber-400' : 'text-slate-600'}`}>
                                                            <Coins className="w-3 h-3" /> {isEarned ? '+' : ''}{achievement.reward_scraps} Iron Scraps
                                                        </p>
                                                    )}
                                                    {hasRewardTitle && (
                                                        <div className="mt-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-1 inline-flex items-center gap-1">
                                                            <Crown className="w-3 h-3 text-yellow-400" />
                                                            <span className="text-xs font-bold text-yellow-400">Title: {(achievement as any).reward_title}</span>
                                                        </div>
                                                    )}
                                                    {isEarned && hasRewardTitle && (
                                                        <button
                                                            onClick={() => handleEquipTitle(achievement)}
                                                            disabled={equippingId === achievement.id}
                                                            className="mt-2 block px-3 py-1 rounded-lg text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                                                        >
                                                            {equippingId === achievement.id ? 'Equipping...' : 'Equip Title'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
