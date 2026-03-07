"use client"

import { useState } from "react"
import { Flame } from "lucide-react"
import { WodPicker } from "@/components/wod/wod-picker"
import { ActiveWod, type WodResult } from "@/components/wod/active-wod"
import { WodResultsModal } from "@/components/wod/wod-results-modal"
import { useUserStore } from "@/lib/store/user-store"
import type { WodTemplate } from "@/lib/supabase/data-hooks"
import { useRouter } from "next/navigation"

type WodPhase = 'pick' | 'active' | 'results'

export default function WodPage() {
    const { user } = useUserStore()
    const router = useRouter()
    const [phase, setPhase] = useState<WodPhase>('pick')
    const [selectedWod, setSelectedWod] = useState<WodTemplate | null>(null)
    const [wodResult, setWodResult] = useState<WodResult | null>(null)
    const [xpEarned, setXpEarned] = useState(0)

    const handleSelectWod = (wod: WodTemplate) => {
        setSelectedWod(wod)
        setPhase('active')
    }

    const handleWodComplete = async (result: WodResult) => {
        if (!user) return
        setWodResult(result)

        // Estimate XP: 2 XP per bodyweight rep, weight*reps/100 for weighted
        let estimatedXP = 0
        result.movements.forEach(m => {
            const reps = result.wodType === 'amrap'
                ? m.reps * result.roundsCompleted
                : m.reps * (selectedWod?.rounds || 1)
            if (m.weight_lbs) {
                estimatedXP += (m.weight_lbs * reps) / 100
            } else {
                estimatedXP += reps * 2
            }
        })
        setXpEarned(Math.round(estimatedXP))

        setPhase('results')
    }

    const handleResultsDismiss = () => {
        setPhase('pick')
        setSelectedWod(null)
        setWodResult(null)
        router.push('/dashboard')
    }

    const handleCreateCustom = () => {
        // TODO: custom WOD builder modal
        alert('Custom WOD builder coming soon!')
    }

    return (
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-8">
            {phase === 'pick' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                            <Flame className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white font-cinzel">WOD</h1>
                            <p className="text-sm text-slate-400">Workout of the Day</p>
                        </div>
                    </div>
                    <WodPicker onSelectWod={handleSelectWod} onCreateCustom={handleCreateCustom} />
                </div>
            )}

            {phase === 'active' && selectedWod && (
                <ActiveWod
                    wod={selectedWod}
                    onComplete={handleWodComplete}
                    onCancel={() => { setPhase('pick'); setSelectedWod(null) }}
                />
            )}

            {phase === 'results' && wodResult && (
                <WodResultsModal
                    isOpen={true}
                    onDismiss={handleResultsDismiss}
                    wodName={wodResult.wodName}
                    wodType={wodResult.wodType}
                    elapsedMs={wodResult.elapsedMs}
                    roundsCompleted={wodResult.roundsCompleted}
                    extraReps={wodResult.extraReps}
                    xpEarned={xpEarned}
                />
            )}
        </div>
    )
}
