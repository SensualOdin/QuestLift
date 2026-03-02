"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sword, Dumbbell, Trophy, ArrowRight, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useUserStore } from "@/lib/store/user-store"
import { useRouter } from "next/navigation"

interface OnboardingModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    currentName: string
}

export function OnboardingModal({ isOpen, onClose, userId, currentName }: OnboardingModalProps) {
    const [step, setStep] = useState(0)
    const [displayName, setDisplayName] = useState(currentName)
    const [isSaving, setIsSaving] = useState(false)
    const { refreshProfile } = useUserStore()
    const router = useRouter()

    const markComplete = () => {
        localStorage.setItem(`questlift_onboarded_${userId}`, 'true')
        onClose()
    }

    const handleSaveName = async () => {
        if (!displayName.trim()) return
        setIsSaving(true)
        const supabase = createClient()
        await supabase
            .from('users')
            .update({ display_name: displayName.trim() })
            .eq('id', userId)
        await refreshProfile()
        setIsSaving(false)
        setStep(1)
    }

    const handleFinish = () => {
        markComplete()
        router.push('/dashboard/workout')
    }

    const steps = [
        // Step 0: Welcome + Name
        <motion.div key="step-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/30 relative">
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl animate-pulse" />
                    <Sword className="w-10 h-10 text-indigo-400 relative z-10" />
                </div>
                <h2 className="text-2xl font-extrabold text-white">Welcome, Adventurer</h2>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                    Your quest begins now. Every rep brings you closer to legend.
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-400">Your Name</label>
                <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name..."
                    className="bg-slate-900 border-slate-800 text-center text-lg font-medium focus-visible:ring-indigo-500"
                />
            </div>

            <Button
                onClick={handleSaveName}
                disabled={isSaving || !displayName.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 text-lg"
            >
                {isSaving ? "Saving..." : "Begin Quest"} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
        </motion.div>,

        // Step 1: How It Works
        <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-extrabold text-white">How It Works</h2>
                <p className="text-slate-400 text-sm">Your workouts fuel your RPG character.</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800/60">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 flex-shrink-0">
                        <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-200 text-sm">Log Workouts</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Track your sets, weight, reps, and RPE. Every rep counts.</p>
                    </div>
                </div>

                <div className="flex items-start gap-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800/60">
                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 flex-shrink-0">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-200 text-sm">Earn XP & Level Up</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Heavier lifts and higher intensity earn more XP. Choose a class at Level 6.</p>
                    </div>
                </div>

                <div className="flex items-start gap-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800/60">
                    <div className="p-2 bg-red-500/20 rounded-lg text-red-400 flex-shrink-0">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-200 text-sm">Fight Bosses Together</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Join a party and fight weekly raid bosses. 1 lb lifted = 1 damage.</p>
                    </div>
                </div>
            </div>

            <Button
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 text-lg"
            >
                Got It <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <button onClick={markComplete} className="w-full text-sm text-slate-400 hover:text-slate-300 transition-colors py-1">
                Skip
            </button>
        </motion.div>,

        // Step 2: Start First Workout
        <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30">
                    <Dumbbell className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-extrabold text-white">Time to Train</h2>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                    Your first workout awaits. Pick a template or build your own.
                </p>
            </div>

            <Button
                onClick={handleFinish}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 text-lg"
            >
                Start First Workout <Dumbbell className="w-5 h-5 ml-2" />
            </Button>
            <button onClick={markComplete} className="w-full text-sm text-slate-400 hover:text-slate-300 transition-colors py-1">
                I'll explore first
            </button>
        </motion.div>
    ]

    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-[450px] bg-slate-950 border-slate-800 text-slate-50 p-8" showCloseButton={false}>
                <DialogTitle className="sr-only">Welcome to QuestLift</DialogTitle>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-slate-950 to-purple-500/5 pointer-events-none rounded-2xl" />

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-6 relative z-10">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-indigo-400' : i < step ? 'bg-indigo-400/50' : 'bg-slate-700'}`}
                        />
                    ))}
                </div>

                <div className="relative z-10">
                    <AnimatePresence mode="wait">
                        {steps[step]}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    )
}
