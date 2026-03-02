"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useReducedMotion } from "@/lib/utils/motion"

interface LevelUpModalProps {
    isOpen: boolean
    oldLevel: number
    newLevel: number
    onDismiss: () => void
}

function getMilestoneText(level: number): string | null {
    if (level === 6) return "Class Selection Unlocked!"
    if (level === 10) return "Tier 2 Unlocked!"
    if (level === 25) return "Tier 3 Unlocked!"
    if (level === 50) return "LEGENDARY STATUS!"
    return null
}

export function LevelUpModal({ isOpen, oldLevel, newLevel, onDismiss }: LevelUpModalProps) {
    const reducedMotion = useReducedMotion()
    const [showParticles, setShowParticles] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        const t = setTimeout(() => setShowParticles(true), 300)
        const dismiss = setTimeout(onDismiss, 4000)
        return () => { clearTimeout(t); clearTimeout(dismiss) }
    }, [isOpen, onDismiss])

    if (!isOpen) return null

    const milestone = getMilestoneText(newLevel)

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onDismiss}
                className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center cursor-pointer"
            >
                <div className="text-center space-y-4 relative">
                    {/* Particle sparkles — skip when reduced motion */}
                    {showParticles && !reducedMotion && (
                        <>
                            {[...Array(12)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{
                                        opacity: 1,
                                        scale: 0,
                                        x: 0,
                                        y: 0,
                                    }}
                                    animate={{
                                        opacity: 0,
                                        scale: 1,
                                        x: Math.cos((i * 30 * Math.PI) / 180) * 120,
                                        y: Math.sin((i * 30 * Math.PI) / 180) * 120,
                                    }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-400"
                                    style={{ boxShadow: '0 0 8px rgba(250, 204, 21, 0.8)' }}
                                />
                            ))}
                        </>
                    )}

                    {/* Glow */}
                    <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-3xl scale-150 pointer-events-none" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-sm text-yellow-300/80 uppercase tracking-[0.3em] font-bold"
                    >
                        Level Up
                    </motion.div>

                    <motion.div
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                        className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-500 drop-shadow-2xl"
                        style={{ textShadow: '0 0 40px rgba(250, 204, 21, 0.4)' }}
                    >
                        {newLevel}
                    </motion.div>

                    {milestone && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="text-sm font-bold text-purple-300 tracking-wide"
                        >
                            {milestone}
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="text-xs text-slate-400 mt-4"
                    >
                        Tap to continue
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
