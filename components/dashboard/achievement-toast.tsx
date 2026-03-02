"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Sword, Shield, Flame, Star, Users, Dumbbell, Swords, RefreshCcw, X, Coins } from "lucide-react"
import type { Achievement } from "@/lib/achievements"

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
}

interface AchievementToastProps {
    achievements: Achievement[]
    onDismiss: () => void
}

export function AchievementToast({ achievements, onDismiss }: AchievementToastProps) {
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        if (achievements.length === 0) return

        const timer = setTimeout(() => {
            if (currentIndex < achievements.length - 1) {
                setCurrentIndex(prev => prev + 1)
            } else {
                onDismiss()
            }
        }, 4000)

        return () => clearTimeout(timer)
    }, [currentIndex, achievements.length, onDismiss])

    if (achievements.length === 0) return null

    const achievement = achievements[currentIndex]
    const Icon = ICON_MAP[achievement.icon] || Trophy

    return (
        <AnimatePresence>
            <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
            >
                <div className="bg-slate-950 border-2 border-yellow-500/50 rounded-2xl p-4 shadow-2xl shadow-yellow-500/20 backdrop-blur-xl">
                    <button
                        onClick={onDismiss}
                        className="absolute top-2 right-2 text-slate-400 hover:text-white p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-500 rounded-xl blur-md opacity-30 animate-pulse" />
                            <div className="relative p-3 bg-yellow-500/20 rounded-xl border border-yellow-500/30 text-yellow-400">
                                <Icon className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="flex-1">
                            <p className="text-[11px] uppercase tracking-widest font-bold text-yellow-500 mb-0.5">
                                Achievement Unlocked!
                            </p>
                            <h4 className="font-bold text-white text-sm">{achievement.name}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{achievement.description}</p>
                            {achievement.reward_scraps > 0 && (
                                <p className="text-xs text-amber-400 font-medium mt-1 flex items-center gap-1">
                                    <Coins className="w-3 h-3" /> +{achievement.reward_scraps} Iron Scraps
                                </p>
                            )}
                        </div>
                    </div>

                    {achievements.length > 1 && (
                        <div className="flex justify-center gap-1 mt-3">
                            {achievements.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIndex ? 'bg-yellow-400' : 'bg-slate-700'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
