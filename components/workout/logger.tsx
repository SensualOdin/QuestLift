"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, Dumbbell, Timer, Plus, Trash2, Activity, Trophy } from "lucide-react"
import { useUserStore } from "@/lib/store/user-store"
import { fetchAllExercises, fetchExercisePR, saveWorkoutSession, type Exercise } from "@/lib/supabase/data-hooks"
import { useRouter } from "next/navigation"
import { ExercisePickerModal } from "./exercise-picker-modal"
import { TemplatePicker } from "./template-picker"
import { AchievementToast } from "@/components/dashboard/achievement-toast"
import type { Achievement } from "@/lib/achievements"

interface LoggedSet {
    id: string
    set_order: number
    reps: string
    weight: string
    duration: string
    rpe: string
    completed: boolean
    isPR: boolean
}

interface ActiveExercise {
    id: string
    exerciseDef: Exercise
    sets: LoggedSet[]
    previousBest: number
}

export function WorkoutLogger() {
    const { user, refreshProfile } = useUserStore()
    const router = useRouter()

    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
    const [workoutExercises, setWorkoutExercises] = useState<ActiveExercise[]>([])

    const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [activeTimer, setActiveTimer] = useState<number>(0)
    const [timerRunning, setTimerRunning] = useState(false)

    // Exercise picker modal
    const [showExercisePicker, setShowExercisePicker] = useState(false)

    // Achievement toast
    const [newAchievements, setNewAchievements] = useState<Achievement[]>([])

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

    const addExerciseToWorkout = async (exerciseDef: Exercise) => {
        let previousBest = 0
        if (user && exerciseDef.exercise_type === 'Strength') {
            previousBest = await fetchExercisePR(user.id, exerciseDef.id)
        }

        setWorkoutExercises(prev => [
            ...prev,
            {
                id: Math.random().toString(),
                exerciseDef,
                previousBest,
                sets: [{ id: Math.random().toString(), set_order: 1, reps: "", weight: "", duration: "", rpe: "", completed: false, isPR: false }]
            }
        ])
    }

    const handleTemplateSelect = async (exerciseNames: string[]) => {
        for (const name of exerciseNames) {
            const ex = availableExercises.find(e => e.name === name)
            if (ex) {
                await addExerciseToWorkout(ex)
            }
        }
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
                        completed: false,
                        isPR: false
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
                    sets: ex.sets.map(s => {
                        if (s.id === setId) {
                            const updated = { ...s, [field]: value }
                            if (field === 'weight' && ex.exerciseDef.exercise_type === 'Strength') {
                                const w = parseFloat(updated.weight) || 0
                                updated.isPR = w > 0 && w > ex.previousBest
                            }
                            return updated
                        }
                        return s
                    })
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

        let totalVolume = 0
        const allSetsToInsert: any[] = []
        const exerciseTypes = new Map<string, string>()

        workoutExercises.forEach(ex => {
            exerciseTypes.set(ex.exerciseDef.id, ex.exerciseDef.exercise_type || 'Strength')

            ex.sets.filter(s => s.completed).forEach(s => {
                const isStrength = ex.exerciseDef.exercise_type === 'Strength'
                const w = parseFloat(s.weight) || 0
                const r = parseInt(s.reps) || 0
                const dur = parseInt(s.duration) || 0

                if (isStrength) {
                    totalVolume += (w * r)
                }

                allSetsToInsert.push({
                    exercise_id: ex.exerciseDef.id,
                    set_order: s.set_order,
                    weight: isStrength ? w : null,
                    reps: isStrength ? r : dur,
                    rpe: parseFloat(s.rpe) || null,
                    is_pr: s.isPR && isStrength
                })
            })
        })

        if (allSetsToInsert.length === 0) {
            alert('No completed sets to save. Complete at least one set first.')
            setIsSaving(false)
            return
        }

        const workoutInsert = {
            user_id: user.id,
            name: "Sweat Session",
            start_time: workoutStartTime?.toISOString() || new Date().toISOString(),
            end_time: new Date().toISOString(),
            total_volume: totalVolume,
            xp_earned: 0,
            notes: ""
        }

        const result = await saveWorkoutSession(
            workoutInsert,
            allSetsToInsert,
            exerciseTypes,
            user.id,
            user.class_name
        )

        if (result.success) {
            await refreshProfile()

            if (result.achievements.length > 0) {
                setNewAchievements(result.achievements)
                // Wait for achievements to be dismissed before navigating
            } else {
                router.push('/dashboard/history')
            }
        } else {
            alert('Failed to save workout. Please try again.')
            setIsSaving(false)
        }
    }

    const handleDismissAchievements = () => {
        setNewAchievements([])
        router.push('/dashboard/history')
    }

    return (
        <div className="space-y-4 sm:space-y-6 pb-32 sm:pb-24">
            {/* Achievement Toast */}
            {newAchievements.length > 0 && (
                <AchievementToast achievements={newAchievements} onDismiss={handleDismissAchievements} />
            )}

            {/* Header & Global Rest Timer */}
            <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md py-3 sm:py-4 border-b border-slate-800/60 -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:py-0">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-lg sm:text-2xl font-bold text-white">
                            Current Workout
                        </h2>
                        <p className="text-xs text-indigo-400">
                            {workoutExercises.length} exercise{workoutExercises.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className={`border rounded-xl px-3 py-1.5 flex items-center gap-2 transition-colors shrink-0 ${timerRunning ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-900 border-slate-800'}`}>
                        <Timer className={`w-4 h-4 ${timerRunning ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold leading-tight">Rest</span>
                            <span className={`font-mono text-sm font-bold leading-tight ${timerRunning ? 'text-indigo-400' : 'text-slate-300'}`}>
                                {formatTime(activeTimer)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Template Picker - show when no exercises added yet */}
            {workoutExercises.length === 0 && (
                <TemplatePicker onSelectTemplate={handleTemplateSelect} />
            )}

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
                                        <div className="text-xs text-slate-400 mt-0.5">
                                            {activeEx.exerciseDef.equipment}
                                            {isStrength && activeEx.previousBest > 0 && (
                                                <span className="text-yellow-500 ml-2">PR: {activeEx.previousBest} lbs</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeExercise(activeEx.id)} className="text-slate-500 hover:text-red-400 hover:bg-red-400/10">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-2 sm:p-4 space-y-2">
                                {/* Column headers - mobile: compact, desktop: full */}
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold text-slate-500 px-1 mb-1">
                                    <div className="w-8 text-center hidden sm:block">Set</div>
                                    <div className="hidden sm:block w-20 text-center">Prev</div>
                                    {isStrength ? (
                                        <>
                                            <div className="flex-1 text-center">lbs</div>
                                            <div className="flex-1 text-center">Reps</div>
                                            <div className="flex-1 text-center">RPE</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex-1 text-center">Min</div>
                                            <div className="flex-1 text-center">RPE</div>
                                        </>
                                    )}
                                    <div className="w-11 sm:w-11 text-center"><Check className="w-3.5 h-3.5 inline-block" /></div>
                                </div>

                                {activeEx.sets.map((set, setIndex) => (
                                    <div key={set.id} className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-xl border transition-colors ${set.isPR ? 'bg-yellow-500/10 border-yellow-500/30' : set.completed ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-slate-950/50 border-slate-800/60'}`}>
                                        <div className="w-8 text-center font-bold text-slate-400 text-sm hidden sm:block">
                                            {set.isPR ? <Trophy className="w-4 h-4 text-yellow-500 mx-auto" /> : setIndex + 1}
                                        </div>
                                        <div className="hidden sm:block w-20 text-center">
                                            <span className="text-xs text-slate-700">{activeEx.previousBest > 0 ? `${activeEx.previousBest}` : '-'}</span>
                                        </div>

                                        {isStrength ? (
                                            <>
                                                <div className="flex-1">
                                                    <Input inputMode="decimal" type="number" placeholder="0" value={set.weight} onChange={e => updateSet(activeEx.id, set.id, 'weight', e.target.value)} disabled={set.completed} className={`h-11 text-base text-center bg-slate-900 border-slate-800 px-1 ${set.isPR ? 'text-yellow-400 font-bold' : ''}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <Input inputMode="numeric" type="number" placeholder="0" value={set.reps} onChange={e => updateSet(activeEx.id, set.id, 'reps', e.target.value)} disabled={set.completed} className="h-11 text-base text-center bg-slate-900 border-slate-800 px-1" />
                                                </div>
                                                <div className="flex-1">
                                                    <Input inputMode="decimal" type="number" placeholder="RPE" value={set.rpe} onChange={e => updateSet(activeEx.id, set.id, 'rpe', e.target.value)} disabled={set.completed} className="h-11 text-base text-center bg-slate-900 border-slate-800 px-1" />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex-1">
                                                    <Input inputMode="numeric" type="number" placeholder="Min" value={set.duration} onChange={e => updateSet(activeEx.id, set.id, 'duration', e.target.value)} disabled={set.completed} className="h-11 text-base text-center bg-slate-900 border-slate-800 px-1" />
                                                </div>
                                                <div className="flex-1">
                                                    <Input inputMode="decimal" type="number" placeholder="RPE" value={set.rpe} onChange={e => updateSet(activeEx.id, set.id, 'rpe', e.target.value)} disabled={set.completed} className="h-11 text-base text-center bg-slate-900 border-slate-800 px-1" />
                                                </div>
                                            </>
                                        )}

                                        <Button variant={set.completed ? "default" : "secondary"} size="icon" onClick={() => toggleSetComplete(activeEx.id, set.id, activeEx.exerciseDef.exercise_type!)} className={`h-11 w-11 shrink-0 ${set.completed ? 'bg-indigo-500 text-white active:bg-indigo-600' : 'bg-slate-800 text-slate-400 active:bg-indigo-500 active:text-white'}`}>
                                            <Check className="w-5 h-5" />
                                        </Button>
                                    </div>
                                ))}

                                <Button variant="outline" onClick={() => addSet(activeEx.id)} className="w-full mt-2 h-11 border-dashed border-slate-700 bg-transparent text-slate-400 active:text-white active:border-indigo-500/50 active:bg-indigo-500/10 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/10">
                                    <Plus className="w-4 h-4 mr-2" /> Add Set
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Add Exercise Button */}
            <div className="pt-3 sm:pt-4 border-t border-slate-800/60">
                <Button
                    variant="outline"
                    onClick={() => setShowExercisePicker(true)}
                    className="w-full border-dashed border-slate-700 bg-slate-900/40 text-slate-300 active:text-white active:border-indigo-500/50 active:bg-indigo-500/10 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/10 py-5 sm:py-6 text-base font-semibold"
                >
                    <Plus className="w-5 h-5 mr-2" /> Add Exercise
                </Button>
            </div>

            {/* Exercise Picker Modal */}
            <ExercisePickerModal
                isOpen={showExercisePicker}
                onClose={() => setShowExercisePicker(false)}
                onSelect={(exercise) => {
                    addExerciseToWorkout(exercise)
                    setShowExercisePicker(false)
                }}
                exercises={availableExercises}
            />

            {/* Complete Workout Action - sticky on mobile */}
            <div className="fixed bottom-16 left-0 right-0 z-40 p-3 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/60 sm:relative sm:bottom-auto sm:p-0 sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:pt-4 pb-safe">
                <Button size="lg" disabled={isSaving || workoutExercises.length === 0} onClick={finishWorkout} className="w-full sm:w-auto px-8 py-6 sm:py-4 font-bold shadow-lg text-white text-base bg-indigo-600 active:bg-indigo-700 hover:bg-indigo-700 shadow-indigo-500/25">
                    {isSaving ? "Saving..." : "Complete Workout"}
                </Button>
            </div>
        </div>
    )
}
