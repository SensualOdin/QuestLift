"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sword, Zap, Flame, Trophy, Coins, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BattleLogEntry } from "@/lib/supabase/data-hooks"

interface BattleLogModalProps {
    isOpen: boolean
    onDismiss: () => void
    battleLog: BattleLogEntry[]
    xpEarned: number
    totalVolume: number
    streakCount: number
    ironScrapsEarned: number
    oldLevel: number
    newLevel: number
}

export function BattleLogModal({
    isOpen,
    onDismiss,
    battleLog,
    xpEarned,
    totalVolume,
    streakCount,
    ironScrapsEarned,
}: BattleLogModalProps) {
    const [visibleLines, setVisibleLines] = useState(0)
    const [showSummary, setShowSummary] = useState(false)

    const totalLines = battleLog.length

    // Compute damage summary from battle log entries (totalVolume only counts strength)
    const strengthDamage = battleLog.filter(e => e.exerciseType === 'Strength').reduce((sum, e) => sum + e.volume, 0)
    const cardioMinutes = battleLog.filter(e => e.exerciseType !== 'Strength').reduce((sum, e) => sum + e.reps, 0)
    const hasStrength = strengthDamage > 0
    const hasCardio = cardioMinutes > 0

    useEffect(() => {
        if (!isOpen) {
            setVisibleLines(0)
            setShowSummary(false)
            return
        }

        // Typewriter effect: reveal one line every 400ms
        if (visibleLines < totalLines) {
            const timer = setTimeout(() => setVisibleLines(v => v + 1), 400)
            return () => clearTimeout(timer)
        } else if (visibleLines === totalLines && !showSummary) {
            const timer = setTimeout(() => setShowSummary(true), 600)
            return () => clearTimeout(timer)
        }
    }, [isOpen, visibleLines, totalLines, showSummary])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4"
                >
                    {/* Header */}
                    <div className="text-center space-y-1">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", duration: 0.6 }}
                        >
                            <Sword className="w-10 h-10 text-red-400 mx-auto" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Battle Complete</h2>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Workout Recap</p>
                    </div>

                    {/* Damage Lines */}
                    <div className="space-y-2 font-mono text-sm">
                        {battleLog.slice(0, visibleLines).map((entry, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`p-2.5 rounded-lg border ${entry.isPR
                                    ? 'bg-yellow-500/10 border-yellow-500/30'
                                    : 'bg-slate-900/60 border-slate-800/60'
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    {entry.isPR ? (
                                        <Trophy className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                                    ) : (
                                        <Zap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                    )}
                                    <div className="min-w-0">
                                        <span className="text-slate-200 font-semibold">
                                            {entry.exerciseName}
                                        </span>
                                        {entry.exerciseType === 'Strength' ? (
                                            <span className="text-slate-400">
                                                {' '}dealt{' '}
                                                <span className="text-red-400 font-bold">
                                                    {entry.volume.toLocaleString()} DMG
                                                </span>
                                                {' '}
                                                <span className="text-slate-500">
                                                    ({entry.sets}x @ {entry.weight}lbs)
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">
                                                {' '}channeled for{' '}
                                                <span className="text-emerald-400 font-bold">
                                                    {entry.reps} min
                                                </span>
                                            </span>
                                        )}
                                        {entry.isPR && (
                                            <div className="text-yellow-400 text-xs font-bold mt-0.5 animate-pulse">
                                                CRITICAL HIT! New PR!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Typing indicator */}
                        {visibleLines < totalLines && (
                            <motion.div
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="text-slate-600 text-xs pl-2"
                            >
                                ...
                            </motion.div>
                        )}
                    </div>

                    {/* Summary */}
                    {showSummary && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="border-t border-slate-800 pt-4 space-y-3"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 text-center">
                                    {hasStrength && (
                                        <>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Damage</div>
                                            <div className="text-lg font-bold text-red-400 font-mono">
                                                {strengthDamage.toLocaleString()}
                                            </div>
                                        </>
                                    )}
                                    {hasCardio && (
                                        <>
                                            <div className={`text-[10px] text-slate-500 uppercase tracking-wider ${hasStrength ? 'mt-1.5 pt-1.5 border-t border-slate-800/60' : ''}`}>Cardio</div>
                                            <div className="text-lg font-bold text-emerald-400 font-mono">
                                                {cardioMinutes} min
                                            </div>
                                        </>
                                    )}
                                    {!hasStrength && !hasCardio && (
                                        <>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Damage</div>
                                            <div className="text-lg font-bold text-red-400 font-mono">0</div>
                                        </>
                                    )}
                                </div>
                                <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 text-center">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">XP Earned</div>
                                    <div className="text-lg font-bold text-indigo-400 font-mono">
                                        +{xpEarned}
                                    </div>
                                </div>
                                <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 text-center">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
                                        <Flame className="w-3 h-3" /> Streak
                                    </div>
                                    <div className="text-lg font-bold text-orange-400 font-mono">
                                        {streakCount} day{streakCount !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 text-center">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
                                        <Coins className="w-3 h-3" /> Scraps
                                    </div>
                                    <div className="text-lg font-bold text-yellow-500 font-mono">
                                        +{ironScrapsEarned}
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={onDismiss}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-700 text-white font-bold py-5"
                            >
                                Continue <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
