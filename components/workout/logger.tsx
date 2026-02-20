"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, Dumbbell, Timer, Plus, Trash2, Activity, Play, StopCircle, RefreshCcw } from "lucide-react"
import { useUserStore } from "@/lib/store/user-store"
import { fetchAllExercises, saveWorkoutSession, type Exercise } from "@/lib/supabase/data-hooks"
import { useRouter } from "next/navigation"

interface LoggedSet {
    id: string
    set_order: number
    reps: string
    weight: string
    duration: string
    rpe: string
    completed: boolean
}

interface ActiveExercise {
    id: string
    exerciseDef: Exercise
    sets: LoggedSet[]
}

export function WorkoutLogger() {
    const { user } = useUserStore()
    const router = useRouter()

    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
    const [workoutExercises, setWorkoutExercises] = useState<ActiveExercise[]>([])

    // Workout Metadata
    const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Timer State
    const [activeTimer, setActiveTimer] = useState<number>(0)
    const [timerRunning, setTimerRunning] = useState(false)

    useEffect(() => {
        loadExercises()
        setWorkoutStartTime(new Date())
    }, [])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (timerRunning && activeTimer > 0) {
            interval = setInterval(() => {
                setActiveTimer((prev) => prev - 1)
            }, 1000)
        } else if (activeTimer === 0) {
            setTimerRunning(false)
        }
        return () => clearInterval(interval)
    }, [timerRunning, activeTimer])

    const loadExercises = async () => {
        const data = await fetchAllExercises()
        setAvailableExercises(data)
    }

    const startRestTimer = (seconds: number) => {
        setActiveTimer(seconds)
        setTimerRunning(true)
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0')
        const s = (seconds % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    const addExerciseToWorkout = (exerciseDef: Exercise) => {
        setWorkoutExercises([
            ...workoutExercises,
            {
                id: Math.random().toString(),
                exerciseDef,
                sets: [{ id: Math.random().toString(), set_order: 1, reps: "", weight: "", duration: "", rpe: "", completed: false }]
            }
        ])
    }

    const addSet = (exerciseId: string) => {
        setWorkoutExercises(workoutExercises.map(ex => {
            if (ex.id === exerciseId) {
                const lastSet = ex.sets[ex.sets.length - 1]
                return {
                    ...ex,
                    sets: [...ex.sets, {
                        id: Math.random().toString(),
                        set_order: ex.sets.length + 1,
                        reps: lastSet ? lastSet.reps : "",
                        weight: lastSet ? lastSet.weight : "",
                        duration: lastSet ? lastSet.duration : "",
                        rpe: "",
                        completed: false
                    }]
                }
            }
            return ex
        }))
    }

    const updateSet = (exerciseId: string, setId: string, field: keyof LoggedSet, value: string | boolean) => {
        setWorkoutExercises(workoutExercises.map(ex => {
            if (ex.id === exerciseId) {
                return {
                    ...ex,
                    sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
                }
            }
            return ex
        }))
    }

    const toggleSetComplete = (exerciseId: string, setId: string, exerciseType: string) => {
        setWorkoutExercises(workoutExercises.map(ex => {
            if (ex.id === exerciseId) {
                return {
                    ...ex,
                    sets: ex.sets.map(s => {
                        if (s.id === setId) {
                            const newlyCompleted = !s.completed
                            if (newlyCompleted) {
                                startRestTimer(exerciseType === 'Strength' ? 120 : 60)
                            }
                            return { ...s, completed: newlyCompleted }
                        }
                        return s
                    })
                }
            }
            return ex
        }))
    }

    const removeExercise = (exerciseId: string) => {
        setWorkoutExercises(workoutExercises.filter(ex => ex.id !== exerciseId))
    }

    const finishWorkout = async () => {
        if (!user || workoutExercises.length === 0) return
        setIsSaving(true)

        // Calculate totals
        let totalVolume = 0
        const allSetsToInsert: any[] = []

        workoutExercises.forEach(ex => {
            ex.sets.filter(s => s.completed).forEach(s => {
                const w = parseFloat(s.weight) || 0
                const r = parseInt(s.reps) || 0
                totalVolume += (w * r)

                allSetsToInsert.push({
                    exercise_id: ex.exerciseDef.id,
                    set_order: s.set_order,
                    weight: w,
                    reps: r,
                    rpe: parseFloat(s.rpe) || null,
                    is_pr: false
                })
            })
        })

        // Simple formula: 10 XP per logged set
        const xpEarned = allSetsToInsert.length * 10

        const workoutInsert = {
            user_id: user.id,
            name: "Sweat Session",
            start_time: workoutStartTime?.toISOString() || new Date().toISOString(),
            end_time: new Date().toISOString(),
            total_volume: totalVolume,
            xp_earned: xpEarned,
            notes: ""
        }

        const success = await saveWorkoutSession(workoutInsert, allSetsToInsert)
        if (success) {
            router.push('/dashboard/history')
        } else {
            alert('Failed to save workout. Please try again.')
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Header & Global Rest Timer */}
            <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md py-4 border-b border-slate-800/60 -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:py-0">
                <div className="flex flex-row items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                            Current Workout
                        </h2>
                        <p className="text-xs sm:text-sm text-indigo-400 mt-0.5">
                            {workoutExercises.length} Exercises Active
                        </p>
                    </div>

                    {/* Rest Timer Widget */}
                    <div className={`border rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2 sm:gap-3 transition-colors ${timerRunning ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-900 border-slate-800'}`}>
                        <Timer className={`w-4 h-4 sm:w-5 sm:h-5 ${timerRunning ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
                        <div className="flex flex-col">
                            <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider font-semibold leading-tight">Rest Timer</span>
                            <span className={`font-mono text-sm sm:text-base font-bold leading-tight ${timerRunning ? 'text-indigo-400' : 'text-slate-300'}`}>
                                {formatTime(activeTimer)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exercise Logger List */}
            <div className="space-y-6">
                {workoutExercises.map((activeEx, exIndex) => {
                    const isStrength = activeEx.exerciseDef.exercise_type === "Strength"
                    return (
                        <Card key={activeEx.id} className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-lg">
                            <CardHeader className="pb-3 pt-4 px-4 bg-slate-900/80 border-b border-slate-800/60 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isStrength ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                        {isStrength ? <Dumbbell className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <CardTitle className="text-base sm:text-lg">{activeEx.exerciseDef.name}</CardTitle>
                                        <div className="text-xs text-slate-400 mt-0.5">{activeEx.exerciseDef.equipment}</div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeExercise(activeEx.id)} className="text-slate-500 hover:text-red-400 hover:bg-red-400/10">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-2 sm:p-4 space-y-2">
                                {/* Table Headers */}
                                <div className="grid grid-cols-12 gap-1 sm:gap-4 text-[10px] uppercase tracking-wider font-semibold text-slate-500 text-center px-1 mb-2">
                                    <div className="col-span-2 sm:col-span-1 text-left hidden sm:block">Set</div>
                                    {isStrength ? (
                                        <>
                                            <div className="col-span-3 hidden sm:block">Previous</div>
                                            <div className="col-span-4 sm:col-span-2 text-left sm:text-center">lbs</div>
                                            <div className="col-span-4 sm:col-span-2 text-left sm:text-center">Reps</div>
                                            <div className="col-span-4 sm:col-span-2 text-left sm:text-center">RPE</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="col-span-3 hidden sm:block">Previous</div>
                                            <div className="col-span-6 sm:col-span-3 text-left sm:text-center">Duration (m)</div>
                                            <div className="col-span-6 sm:col-span-3 text-left sm:text-center">RPE</div>
                                        </>
                                    )}
                                    <div className="col-span-4 sm:col-span-2 text-right"><Check className="w-4 h-4 inline-block" /></div>
                                </div>

                                {/* Sets rows */}
                                {activeEx.sets.map((set, setIndex) => (
                                    <div key={set.id} className={`grid grid-cols-12 gap-2 sm:gap-4 items-center p-2 rounded-xl border transition-colors ${set.completed ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-slate-950/50 border-slate-800/60'}`}>
                                        <div className="col-span-2 sm:col-span-1 text-center font-bold text-slate-400 hidden sm:block">{setIndex + 1}</div>
                                        <div className="col-span-3 text-center hidden sm:block"><span className="text-slate-700">-</span></div>

                                        {isStrength ? (
                                            <>
                                                <div className="col-span-4 sm:col-span-2">
                                                    <Input type="number" placeholder="0" value={set.weight} onChange={e => updateSet(activeEx.id, set.id, 'weight', e.target.value)} disabled={set.completed} className="h-10 sm:h-9 text-base sm:text-sm text-center bg-slate-900 border-slate-800" />
                                                </div>
                                                <div className="col-span-4 sm:col-span-2">
                                                    <Input type="number" placeholder="0" value={set.reps} onChange={e => updateSet(activeEx.id, set.id, 'reps', e.target.value)} disabled={set.completed} className="h-10 sm:h-9 text-base sm:text-sm text-center bg-slate-900 border-slate-800" />
                                                </div>
                                                <div className="col-span-4 sm:col-span-2">
                                                    <Input type="number" placeholder="RPE" value={set.rpe} onChange={e => updateSet(activeEx.id, set.id, 'rpe', e.target.value)} disabled={set.completed} className="h-10 sm:h-9 text-base sm:text-sm text-center bg-slate-900 border-slate-800" />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="col-span-4 sm:col-span-3">
                                                    <Input type="number" placeholder="Min" value={set.duration} onChange={e => updateSet(activeEx.id, set.id, 'duration', e.target.value)} disabled={set.completed} className="h-10 sm:h-9 text-base sm:text-sm text-center bg-slate-900 border-slate-800" />
                                                </div>
                                                <div className="col-span-4 sm:col-span-3">
                                                    <Input type="number" placeholder="RPE" value={set.rpe} onChange={e => updateSet(activeEx.id, set.id, 'rpe', e.target.value)} disabled={set.completed} className="h-10 sm:h-9 text-base sm:text-sm text-center bg-slate-900 border-slate-800" />
                                                </div>
                                            </>
                                        )}

                                        <div className={`col-span-12 sm:col-span-2 flex justify-end gap-1 ${isStrength ? 'col-span-4' : 'col-span-4'}`}>
                                            <Button variant={set.completed ? "default" : "secondary"} size="icon" onClick={() => toggleSetComplete(activeEx.id, set.id, activeEx.exerciseDef.exercise_type!)} className={`h-10 w-full sm:w-10 sm:h-10 flex-shrink-0 ${set.completed ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-slate-800 text-slate-400 hover:bg-indigo-500 hover:text-white'}`}>
                                                <Check className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <Button variant="outline" onClick={() => addSet(activeEx.id)} className="w-full mt-2 border-dashed border-slate-700 bg-transparent text-slate-400 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/10">
                                    <Plus className="w-4 h-4 mr-2" /> Add Set
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Exercise Selection Footer */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-800/60">
                <div className="flex-1 w-full overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                    <div className="flex gap-2">
                        {availableExercises.map(ex => (
                            <button
                                key={ex.id}
                                onClick={() => addExerciseToWorkout(ex)}
                                className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors border bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-1.5 flex-shrink-0"
                            >
                                <Plus className="w-3 h-3" /> {ex.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Complete Workout Action Action */}
            <div className="flex justify-end pt-4 pb-12 sm:pb-0">
                <Button size="lg" disabled={isSaving || workoutExercises.length === 0} onClick={finishWorkout} className="px-8 font-bold shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25 w-full sm:w-auto">
                    {isSaving ? "Saving..." : "Complete Workout"}
                </Button>
            </div>
        </div>
    )
}
