"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Square, Plus, Minus, Flame, ArrowLeft } from "lucide-react"
import { useWodTimer } from "@/lib/hooks/use-wod-timer"
import type { WodTemplate } from "@/lib/supabase/data-hooks"

export interface WodResult {
    wodName: string
    wodType: string
    elapsedMs: number
    roundsCompleted: number
    extraReps: number
    movements: WodTemplate['movements']
}

interface ActiveWodProps {
    wod: WodTemplate
    onComplete: (result: WodResult) => void
    onCancel: () => void
}

function formatMs(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function ActiveWod({ wod, onComplete, onCancel }: ActiveWodProps) {
    const [extraReps, setExtraReps] = useState(0)
    const [hasStarted, setHasStarted] = useState(false)

    const timerMode = wod.wod_type === 'chipper' ? 'for_time' : wod.wod_type as any

    const handleComplete = useCallback(() => {
        // Timer finished — notify via browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('WOD Complete!', {
                body: `${wod.name} is done!`,
                icon: '/icon-192x192.png',
                tag: 'wod-complete',
            })
        }
    }, [wod.name])

    const timer = useWodTimer({
        mode: timerMode === 'tabata' ? 'tabata' : timerMode,
        timeCapMs: (wod.time_cap_seconds || 1200) * 1000,
        onComplete: handleComplete,
    })

    const handleStart = () => {
        setHasStarted(true)
        timer.start()
    }

    const handleFinish = () => {
        timer.stop()
        onComplete({
            wodName: wod.name,
            wodType: wod.wod_type,
            elapsedMs: timer.elapsedMs,
            roundsCompleted: timer.currentRound,
            extraReps,
            movements: wod.movements,
        })
    }

    const isCountdown = wod.wod_type === 'amrap' || wod.wod_type === 'emom' || wod.wod_type === 'tabata'
    const displayTime = isCountdown ? timer.remainingMs : timer.elapsedMs
    const timerColor = timer.remainingMs < 60000 && isCountdown && timer.isRunning
        ? 'text-red-400' : 'text-amber-400'

    return (
        <div className="space-y-6 pb-32 sm:pb-24">
            <Button variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-white -ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {/* WOD Header */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                    <Flame className="w-6 h-6 text-amber-400" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-white font-cinzel">{wod.name}</h1>
                </div>
                <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold uppercase tracking-wider">
                    {wod.wod_type.replace('_', ' ')}
                    {wod.time_cap_seconds ? ` \u00b7 ${Math.floor(wod.time_cap_seconds / 60)} min` : ''}
                </span>
            </div>

            {/* Timer */}
            <div className="text-center py-8">
                <div className={`text-6xl sm:text-8xl font-mono font-bold ${timerColor} transition-colors`}>
                    {formatMs(displayTime)}
                </div>

                {wod.wod_type === 'emom' && timer.isRunning && (
                    <p className="text-sm text-slate-400 mt-2">
                        Minute {timer.currentInterval} of {Math.floor((wod.time_cap_seconds || 0) / 60)}
                    </p>
                )}

                {wod.wod_type === 'tabata' && timer.isRunning && (
                    <p className={`text-lg font-bold mt-2 ${timer.isWorkPhase ? 'text-red-400' : 'text-green-400'}`}>
                        {timer.isWorkPhase ? 'WORK' : 'REST'}
                    </p>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
                {!hasStarted ? (
                    <Button onClick={handleStart} className="px-12 py-6 text-lg font-bold bg-amber-500 text-black hover:bg-amber-400 active:bg-amber-600">
                        <Play className="w-6 h-6 mr-2" /> Start
                    </Button>
                ) : (
                    <>
                        {timer.isPaused ? (
                            <Button onClick={timer.resume} className="px-8 py-5 bg-amber-500 text-black hover:bg-amber-400">
                                <Play className="w-5 h-5 mr-2" /> Resume
                            </Button>
                        ) : (
                            <Button onClick={timer.pause} variant="outline" className="px-8 py-5 border-amber-500/30 text-amber-400">
                                <Pause className="w-5 h-5 mr-2" /> Pause
                            </Button>
                        )}
                        <Button onClick={handleFinish} className="px-8 py-5 bg-red-500 text-white hover:bg-red-400">
                            <Square className="w-5 h-5 mr-2" /> Finish
                        </Button>
                    </>
                )}
            </div>

            {/* Round Counter */}
            {(wod.wod_type === 'amrap' || wod.wod_type === 'chipper') && hasStarted && (
                <Card className="border-amber-500/20 bg-amber-500/5">
                    <CardContent className="p-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-300">Rounds Completed</span>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => timer.subtractRound()}
                                className="h-11 w-11 border-slate-700 text-slate-400 hover:text-white"
                                disabled={timer.currentRound <= 0}
                            >
                                <Minus className="w-4 h-4" />
                            </Button>
                            <span className="text-3xl font-bold text-amber-400 font-mono w-12 text-center">
                                {timer.currentRound}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => timer.addRound()}
                                className="h-11 w-11 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Extra Reps (AMRAP) */}
            {wod.wod_type === 'amrap' && hasStarted && (
                <Card className="border-slate-800/60 bg-slate-900/40">
                    <CardContent className="p-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-300">Extra Reps</span>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setExtraReps(prev => Math.max(0, prev - 1))}
                                className="h-11 w-11 border-slate-700"
                                disabled={extraReps <= 0}
                            >
                                <Minus className="w-4 h-4" />
                            </Button>
                            <span className="text-2xl font-bold text-slate-200 font-mono w-12 text-center">
                                {extraReps}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setExtraReps(prev => prev + 1)}
                                className="h-11 w-11 border-slate-700"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Movement List */}
            <Card className="border-slate-800/60 bg-slate-900/40">
                <CardContent className="p-4 space-y-2">
                    <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-2">
                        Movements
                        {wod.rounds ? ` \u00d7 ${wod.rounds} rounds` : ''}
                    </h3>
                    {wod.movements.map((movement, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/40 last:border-0">
                            <span className="text-sm text-slate-200">{movement.exercise_name}</span>
                            <div className="text-sm text-slate-400 text-right">
                                <span className="text-amber-400 font-semibold">{movement.reps}</span>
                                {movement.weight_lbs && (
                                    <span className="ml-1">@ {movement.weight_lbs}lb</span>
                                )}
                                {movement.notes && (
                                    <span className="ml-1 text-xs text-slate-500">({movement.notes})</span>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
