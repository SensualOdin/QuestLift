"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Sword, Shield, Wind } from "lucide-react"
import { useUserStore } from "@/lib/store/user-store"
import { createClient } from "@/lib/supabase/client"
import { getXPForNextLevel } from "@/lib/xp-engine"
import { ClassSelectionModal } from "@/components/dashboard/class-selection-modal"
import { updateUserClass } from "@/lib/supabase/data-hooks"

/** Returns the character image path and tier name based on class + level */
function getCharacterArt(className: string | null, level: number): { src: string; tier: string; color: string } {
    if (!className || level < 6) {
        return { src: '/characters/novice.png', tier: 'Novice', color: 'text-slate-400' }
    }

    const cls = className.toLowerCase()

    if (cls === 'tank') {
        if (level >= 50) return { src: '/characters/tank-legendary.png', tier: 'Legendary Tank', color: 'text-yellow-400' }
        if (level >= 25) return { src: '/characters/tank-steel.png', tier: 'Steel Tank', color: 'text-purple-400' }
        if (level >= 10) return { src: '/characters/tank-iron.png', tier: 'Iron Tank', color: 'text-blue-400' }
        return { src: '/characters/tank-starter.png', tier: 'Tank', color: 'text-red-400' }
    }

    if (cls === 'rogue') {
        if (level >= 50) return { src: '/characters/rogue-legendary.png', tier: 'Legendary Rogue', color: 'text-yellow-400' }
        if (level >= 25) return { src: '/characters/rogue-phantom.png', tier: 'Phantom Rogue', color: 'text-purple-400' }
        if (level >= 10) return { src: '/characters/rogue-shadow.png', tier: 'Shadow Rogue', color: 'text-blue-400' }
        return { src: '/characters/rogue-starter.png', tier: 'Rogue', color: 'text-emerald-400' }
    }

    if (cls === 'paladin') {
        if (level >= 50) return { src: '/characters/paladin-legendary.png', tier: 'Legendary Paladin', color: 'text-yellow-400' }
        if (level >= 25) return { src: '/characters/paladin-divine.png', tier: 'Divine Paladin', color: 'text-purple-400' }
        if (level >= 10) return { src: '/characters/paladin-blessed.png', tier: 'Blessed Paladin', color: 'text-blue-400' }
        return { src: '/characters/paladin-starter.png', tier: 'Paladin', color: 'text-indigo-400' }
    }

    return { src: '/characters/novice.png', tier: 'Novice', color: 'text-slate-400' }
}

function getClassIcon(className: string | null) {
    if (!className) return Sword
    if (className === 'Tank') return Shield
    if (className === 'Rogue') return Wind
    return Sword
}

/** Next tier info for progress display */
function getNextTier(className: string | null, level: number): { nextLevel: number; nextName: string } | null {
    if (!className || level < 6) return { nextLevel: 6, nextName: 'Class Selection' }

    const tiers = [
        { level: 10, name: className === 'Tank' ? 'Iron' : className === 'Rogue' ? 'Shadow' : 'Blessed' },
        { level: 25, name: className === 'Tank' ? 'Steel' : className === 'Rogue' ? 'Phantom' : 'Divine' },
        { level: 50, name: 'Legendary' },
    ]

    for (const t of tiers) {
        if (level < t.level) return { nextLevel: t.level, nextName: t.name }
    }

    return null // Already legendary
}

export function UserProfile() {
    const { user, isLoading, fetchProfile, refreshProfile } = useUserStore()
    const [showClassModal, setShowClassModal] = useState(false)

    useEffect(() => {
        const initProfile = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user?.id) {
                await fetchProfile(session.user.id)
            }
        }
        initProfile()
    }, [fetchProfile])

    // Show class selection modal when user reaches level 6+ without a class
    useEffect(() => {
        if (user && (user.level || 1) >= 6 && !user.class_name) {
            setShowClassModal(true)
        }
    }, [user])

    const handleClassSelect = async (className: string) => {
        if (!user) return
        const success = await updateUserClass(user.id, className)
        if (success) {
            await refreshProfile()
            setShowClassModal(false)
        }
    }

    if (isLoading || !user) {
        return (
            <Card className="border-slate-800/80 bg-slate-900/60 p-6 space-y-4">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-48 w-48 rounded-2xl bg-slate-800" />
                    <Skeleton className="h-6 w-32 bg-slate-800" />
                    <Skeleton className="h-4 w-24 bg-slate-800" />
                </div>
                <Skeleton className="h-2 w-full bg-slate-800 mt-8" />
            </Card>
        )
    }

    const level = user.level || 1
    const currentXP = user.xp_current || 0
    const xpNeeded = getXPForNextLevel(level)
    const xpIntoCurrentLevel = currentXP % xpNeeded
    const progressPercent = Math.min((xpIntoCurrentLevel / xpNeeded) * 100, 100)

    const { src: charSrc, tier, color: tierColor } = getCharacterArt(user.class_name, level)
    const ClassIcon = getClassIcon(user.class_name)
    const nextTier = getNextTier(user.class_name, level)

    return (
        <>
        <ClassSelectionModal isOpen={showClassModal} onSelectClass={handleClassSelect} />
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl overflow-hidden relative shadow-2xl">
                {/* Decorative background glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                <CardHeader className="pb-2 relative z-10">
                    <div className="flex flex-col items-center gap-3 pt-2">
                        {/* Character Art */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-xl pointer-events-none" />
                            <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden border-2 border-slate-800/80 bg-slate-950">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={charSrc}
                                    alt={tier}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            {/* Level badge */}
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-4 py-1 rounded-full border border-indigo-500/50 shadow-lg whitespace-nowrap">
                                Lvl {level}
                            </div>
                        </div>

                        {/* Name & Class */}
                        <div className="text-center pt-1">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-white tracking-tight">{user.display_name}</CardTitle>
                            <p className={`text-sm font-semibold mt-1 flex items-center justify-center gap-1.5 ${tierColor}`}>
                                <ClassIcon className="w-3.5 h-3.5" /> {tier}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5 pt-4 relative z-10">
                    {/* XP Bar */}
                    <div>
                        <div className="flex justify-between text-sm mb-2 font-medium">
                            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Experience</span>
                            <span className="text-indigo-300 text-xs">{xpIntoCurrentLevel} / {xpNeeded} XP</span>
                        </div>
                        <div className="relative h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            />
                        </div>
                        <div className="flex justify-between mt-2">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                {xpNeeded - xpIntoCurrentLevel} XP to Level {level + 1}
                            </p>
                            {nextTier && (
                                <p className="text-[10px] text-indigo-400/60 uppercase tracking-wider font-semibold">
                                    {nextTier.nextName} @ Lvl {nextTier.nextLevel}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Attributes */}
                    <div className="pt-4 border-t border-slate-800/60">
                        <h4 className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-3 px-1">Core Attributes</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3 text-center">
                                <div className="text-red-400 text-xs font-bold mb-1">STR</div>
                                <div className="text-lg font-mono text-slate-200" title="Lifetime Volume">
                                    {(user.str_volume_lifetime || 0) > 1000
                                        ? `${((user.str_volume_lifetime || 0) / 1000).toFixed(1)}k`
                                        : user.str_volume_lifetime || 0}
                                </div>
                            </div>
                            <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3 text-center">
                                <div className="text-emerald-400 text-xs font-bold mb-1">DEX</div>
                                <div className="text-lg font-mono text-slate-200" title="Lifetime Cardio Minutes">
                                    {user.dex_minutes_lifetime || 0}
                                </div>
                            </div>
                            <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3 text-center">
                                <div className="text-blue-400 text-xs font-bold mb-1">CON</div>
                                <div className="text-lg font-mono text-slate-200" title="Lifetime Sets">
                                    {user.con_sets_lifetime || 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inventory Summary */}
                    <div className="flex items-center justify-between px-1 pt-2">
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-600 shadow-[0_0_8px_rgba(202,138,4,0.6)]" />
                            Iron Scraps
                        </span>
                        <span className="text-sm font-bold text-yellow-500">{user.iron_scraps || 0}</span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
        </>
    )
}
