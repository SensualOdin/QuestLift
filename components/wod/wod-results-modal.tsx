"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Flame, Trophy, Clock, Repeat } from "lucide-react"

interface WodResultsModalProps {
    isOpen: boolean
    onDismiss: () => void
    wodName: string
    wodType: string
    elapsedMs: number
    roundsCompleted: number
    extraReps: number
    xpEarned: number
}

function formatMs(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function WodResultsModal({
    isOpen,
    onDismiss,
    wodName,
    wodType,
    elapsedMs,
    roundsCompleted,
    extraReps,
    xpEarned,
}: WodResultsModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onDismiss() }}>
            <DialogContent className="sm:max-w-[400px] bg-slate-950 border-amber-500/30 text-slate-50 text-center">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-amber-400 font-cinzel flex items-center justify-center gap-2">
                        <Flame className="w-6 h-6" />
                        WOD Complete
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <h2 className="text-xl font-bold text-white">{wodName}</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60">
                            <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                            <p className="text-2xl font-mono font-bold text-white">{formatMs(elapsedMs)}</p>
                            <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                                {wodType === 'for_time' || wodType === 'chipper' ? 'Finish Time' : 'Duration'}
                            </p>
                        </div>

                        {wodType === 'amrap' && (
                            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60">
                                <Repeat className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                                <p className="text-2xl font-mono font-bold text-white">
                                    {roundsCompleted}{extraReps > 0 ? `+${extraReps}` : ''}
                                </p>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wider">Rounds + Reps</p>
                            </div>
                        )}

                        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60">
                            <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                            <p className="text-2xl font-mono font-bold text-amber-400">+{xpEarned}</p>
                            <p className="text-[11px] text-slate-400 uppercase tracking-wider">XP Earned</p>
                        </div>
                    </div>

                    <Button onClick={onDismiss} className="w-full py-5 bg-amber-500 text-black hover:bg-amber-400 active:bg-amber-600 font-bold text-base">
                        Continue
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
