"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, Dumbbell, Timer, Plus, Trash2, Activity, Trophy, Info } from "lucide-react"
import { useUserStore } from "@/lib/store/user-store"
import { fetchAllExercises, fetchExercisePR, saveWorkoutSession, type Exercise, type WorkoutResult } from "@/lib/supabase/data-hooks"
import { useRouter } from "next/navigation"
import { ExercisePickerModal } from "./exercise-picker-modal"
import { TemplatePicker } from "./template-picker"
import { AchievementToast } from "@/components/dashboard/achievement-toast"
import { BattleLogModal } from "./battle-log-modal"
import { LevelUpModal } from "./level-up-modal"
import type { Achievement } from "@/lib/achievements"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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

const WORKOUT_STORAGE_KEY = 'questlift_active_workout'
const WORKOUT_EXPIRY_HOURS = 24

interface SavedWorkoutState {
    workoutExercises: ActiveExercise[]
    workoutStartTime: string
    savedAt: string
}

function saveWorkoutToStorage(exercises: ActiveExercise[], startTime: Date | null) {
    if (exercises.length === 0) {
        localStorage.removeItem(WORKOUT_STORAGE_KEY)
        return
    }
    const state: SavedWorkoutState = {
        workoutExercises: exercises,
        workoutStartTime: startTime?.toISOString() || new Date().toISOString(),
        savedAt: new Date().toISOString(),
    }
    localStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(state))
}

function loadWorkoutFromStorage(): SavedWorkoutState | null {
    try {
        const raw = localStorage.getItem(WORKOUT_STORAGE_KEY)
        if (!raw) return null
        const state: SavedWorkoutState = JSON.parse(raw)
        const savedAt = new Date(state.savedAt)
        const hoursAgo = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60)
        if (hoursAgo > WORKOUT_EXPIRY_HOURS) {
            localStorage.removeItem(WORKOUT_STORAGE_KEY)
            return null
        }
        return state
    } catch {
        localStorage.removeItem(WORKOUT_STORAGE_KEY)
        return null
    }
}

function clearWorkoutStorage() {
    localStorage.removeItem(WORKOUT_STORAGE_KEY)
}

function RPEInfoPopover() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="inline-flex items-center justify-center text-slate-500 hover:text-indigo-400 transition-colors">
                    <Info className="w-3 h-3" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-slate-900 border-slate-700 text-sm" side="top" align="center">
                <div className="space-y-2">
                    <p className="font-semibold text-white text-xs uppercase tracking-wider">RPE Scale</p>
                    <p className="text-[11px] text-slate-400">Rate of Perceived Exertion - how hard the set felt</p>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-red-400 font-bold">10</span><span className="text-slate-300">Max effort, no reps left</span></div>
                        <div className="flex justify-between"><span className="text-orange-400 font-bold">9</span><span className="text-slate-300">Could maybe do 1 more</span></div>
                        <div className="flex justify-between"><span className="text-amber-400 font-bold">8</span><span className="text-slate-300">Could do 2 more reps</span></div>
                        <div className="flex justify-between"><span className="text-yellow-400 font-bold">7</span><span className="text-slate-300">Could do 3 more reps</span></div>
                        <div className="flex justify-between"><span className="text-green-400 font-bold">6</span><span className="text-slate-300">Could do 4+ more reps</span></div>
                        <div className="flex justify-between"><span className="text-emerald-400 font-bold">5</span><span className="text-slate-300">Moderate effort</span></div>
                        <div className="flex justify-between"><span className="text-slate-400 font-bold">1-4</span><span className="text-slate-300">Light / warmup</span></div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
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

    // Post-workout modals
    const [workoutResult, setWorkoutResult] = useState<WorkoutResult | null>(null)
    const [showBattleLog, setShowBattleLog] = useState(false)
    const [showLevelUp, setShowLevelUp] = useState(false)

    // Resume prompt state
    const [showResumePrompt, setShowResumePrompt] = useState(false)
    const [savedState, setSavedState] = useState<SavedWorkoutState | null>(null)

    useEffect(() => {
        loadExercises()
        const saved = loadWorkoutFromStorage()
        if (saved && saved.workoutExercises.length > 0) {
            setSavedState(saved)
            setShowResumePrompt(true)
        } else {
            setWorkoutStartTime(new Date())
        }
    }, [])

    useEffect(() => {
        saveWorkoutToStorage(workoutExercises, workoutStartTime)
    }, [workoutExercises, workoutStartTime])

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (timerRunning && activeTimer > 0) {
            interval = setInterval(() => {
                setActiveTimer((prev) => {
                    if (prev <= 1) {
                        // Timer just hit zero — notify
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('Rest Over', {
                                body: 'Time to hit your next set!',
                                icon: '/icon-192x192.png',
                                tag: 'rest-timer',
                            })
                        }
                    }
                    return prev - 1
                })
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

    const deleteSet = (exerciseId: string, setId: string) => {
        setWorkoutExercises(prev => {
            const exercise = prev.find(ex => ex.id === exerciseId)
            if (!exercise) return prev

            // If this is the last set, remove the entire exercise
            if (exercise.sets.length <= 1) {
                return prev.filter(ex => ex.id !== exerciseId)
            }

            // Remove the set and re-number remaining sets
            return prev.map(ex => {
                if (ex.id === exerciseId) {
                    const filteredSets = ex.sets
                        .filter(s => s.id !== setId)
                        .map((s, i) => ({ ...s, set_order: i + 1 }))
                    return { ...ex, sets: filteredSets }
                }
                return ex
            })
        })
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

    const handleResumeWorkout = () => {
        if (savedState) {
            setWorkoutExercises(savedState.workoutExercises)
            setWorkoutStartTime(new Date(savedState.workoutStartTime))
        }
        setShowResumePrompt(false)
        setSavedState(null)
    }

    const handleStartFresh = () => {
        clearWorkoutStorage()
        setWorkoutStartTime(new Date())
        setShowResumePrompt(false)
        setSavedState(null)
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
            clearWorkoutStorage()
            await refreshProfile()
            setWorkoutResult(result)

            // Show battle log first
            setShowBattleLog(true)
        } else {
            alert('Failed to save workout. Please try again.')
            setIsSaving(false)
        }
    }

    const handleBattleLogDismiss = () => {
        setShowBattleLog(false)
        if (workoutResult && workoutResult.newLevel > workoutResult.oldLevel) {
            setShowLevelUp(true)
        } else if (workoutResult && workoutResult.achievements.length > 0) {
            setNewAchievements(workoutResult.achievements)
        } else {
            router.push('/dashboard')
        }
    }

    const handleLevelUpDismiss = () => {
        setShowLevelUp(false)
        if (workoutResult && workoutResult.achievements.length > 0) {
            setNewAchievements(workoutResult.achievements)
        } else {
            router.push('/dashboard')
        }
    }

    const handleDismissAchievements = () => {
        setNewAchievements([])
        router.push('/dashboard')
    }

    return (
        <div className="space-y-4 sm:space-y-6 pb-32 sm:pb-24">
            {showResumePrompt && (
                <Card className="border-amber-500/30 bg-amber-500/10 backdrop-blur-xl">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-amber-400 font-semibold">
                            <Dumbbell className="w-5 h-5" />
                            Unfinished Workout Found
                        </div>
                        <p className="text-sm text-slate-300">
                            You have a workout in progress with {savedState?.workoutExercises.length} exercise{(savedState?.workoutExercises.length || 0) !== 1 ? 's' : ''}. Resume where you left off?
                        </p>
                        <div className="flex gap-3">
                            <Button onClick={handleResumeWorkout} className="flex-1 bg-amber-500 text-black hover:bg-amber-400 active:bg-amber-600 font-semibold">
                                Resume Workout
                            </Button>
                            <Button variant="outline" onClick={handleStartFresh} className="flex-1 border-slate-700 text-slate-300 hover:text-white">
                                Start Fresh
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Post-Workout Modals */}
            {workoutResult && (
                <BattleLogModal
                    isOpen={showBattleLog}
                    onDismiss={handleBattleLogDismiss}
                    battleLog={workoutResult.battleLog}
                    xpEarned={workoutResult.xpEarned}
                    totalVolume={workoutResult.totalVolume}
                    streakCount={workoutResult.streakCount}
                    ironScrapsEarned={workoutResult.ironScrapsEarned}
                    oldLevel={workoutResult.oldLevel}
                    newLevel={workoutResult.newLevel}
                />
            )}

            {workoutResult && (
                <LevelUpModal
                    isOpen={showLevelUp}
                    oldLevel={workoutResult.oldLevel}
                    newLevel={workoutResult.newLevel}
                    onDismiss={handleLevelUpDismiss}
                />
            )}

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

            {/* Template Picker - collapsible, always starts closed */}
            <TemplatePicker onSelectTemplate={handleTemplateSelect} defaultOpen={false} />

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
                                            <div className="flex-1 text-center flex items-center justify-center gap-1">RPE <RPEInfoPopover /></div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex-1 text-center">Min</div>
                                            <div className="flex-1 text-center flex items-center justify-center gap-1">RPE <RPEInfoPopover /></div>
                                        </>
                                    )}
                                    <div className="w-11 sm:w-11 text-center"><Check className="w-3.5 h-3.5 inline-block" /></div>
                                </div>

                                {activeEx.sets.map((set, setIndex) => (
                                    <div key={set.id} className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-xl border transition-colors ${set.isPR ? 'bg-yellow-500/10 border-yellow-500/30' : set.completed ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-slate-950/50 border-slate-800/60'}`}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteSet(activeEx.id, set.id)}
                                            disabled={set.completed}
                                            className="h-8 w-8 shrink-0 text-slate-600 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-30"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
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
