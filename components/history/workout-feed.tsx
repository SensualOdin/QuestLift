"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dumbbell, Calendar, Clock, Trophy } from "lucide-react"
import { fetchFullWorkoutHistory } from "@/lib/supabase/data-hooks"
import { useUserStore } from "@/lib/store/user-store"
import { format, differenceInMinutes, parseISO } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

interface FormattedExercise {
    name: string
    sets: number
    topWeight: number | string
}

interface FormattedWorkout {
    id: string
    name: string
    date: string
    duration: string
    xp: number
    volume: number
    prs: number
    exercises: FormattedExercise[]
}

export function WorkoutFeed() {
    const { user } = useUserStore()
    const [history, setHistory] = useState<FormattedWorkout[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadHistory = async () => {
            if (!user) return

            const rawData = await fetchFullWorkoutHistory(user.id)

            const formatted: FormattedWorkout[] = rawData.map(workout => {
                const start = workout.start_time ? parseISO(workout.start_time) : new Date()
                const end = workout.end_time ? parseISO(workout.end_time) : new Date()

                const mins = differenceInMinutes(end, start)
                const hoursStr = Math.floor(mins / 60) > 0 ? `${Math.floor(mins / 60)}h ` : ''
                const minsStr = `${mins % 60}m`

                // Group sets by exercise
                const exerciseMap = new Map<string, { sets: number, topWeight: number }>()
                let prs = 0

                if (Array.isArray(workout.workout_sets)) {
                    workout.workout_sets.forEach((set: any) => {
                        const exName = set.exercises?.name || 'Unknown Exercise'
                        const weight = set.weight || 0

                        if (set.is_pr) prs++

                        if (exerciseMap.has(exName)) {
                            const current = exerciseMap.get(exName)!
                            exerciseMap.set(exName, {
                                sets: current.sets + 1,
                                topWeight: Math.max(current.topWeight, weight)
                            })
                        } else {
                            exerciseMap.set(exName, {
                                sets: 1,
                                topWeight: weight
                            })
                        }
                    })
                }

                const exercises: FormattedExercise[] = Array.from(exerciseMap.entries()).map(([name, data]) => ({
                    name,
                    sets: data.sets,
                    topWeight: data.topWeight > 0 ? data.topWeight : 'Bodyweight'
                }))

                return {
                    id: workout.id,
                    name: workout.name || 'Workout Session',
                    date: workout.start_time ? format(parseISO(workout.start_time), 'MMM d, yyyy') : 'Unknown Date',
                    duration: `${hoursStr}${minsStr}`,
                    xp: workout.xp_earned || 0,
                    volume: workout.total_volume || 0,
                    prs,
                    exercises
                }
            })

            setHistory(formatted)
            setLoading(false)
        }

        loadHistory()
    }, [user])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Quest History
                </h2>
            </div>

            <div className="space-y-4">
                {loading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl bg-slate-800" />)
                ) : history.length > 0 ? (
                    history.map(workout => (
                        <Card key={workout.id} className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl hover:bg-slate-900/60 transition-colors cursor-pointer group">
                            <CardContent className="p-5 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">

                                <div className="space-y-3 flex-1">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                                            {workout.name}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-4 mt-1">
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" /> {workout.date}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" /> {workout.duration}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Dumbbell className="w-3.5 h-3.5" /> {workout.volume.toLocaleString()} lbs
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 text-sm text-slate-400 mt-2">
                                        {workout.exercises.map((ex, i) => (
                                            <span key={i} className="bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                                                <span className="text-slate-300">{ex.sets}x</span> {ex.name}
                                                <span className="text-slate-500 text-xs ml-1">({ex.topWeight}{typeof ex.topWeight === 'number' ? 'lb' : ''})</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex md:flex-col items-center justify-end gap-3 md:min-w-[100px]">
                                    <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 whitespace-nowrap">
                                        +{workout.xp} XP
                                    </Badge>
                                    {workout.prs > 0 && (
                                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 bg-yellow-500/10 whitespace-nowrap">
                                            <Trophy className="w-3 h-3 mr-1" /> {workout.prs} PR{workout.prs > 1 ? 's' : ''}
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="py-12 text-center text-slate-500 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
                        <Dumbbell className="w-8 h-8 opacity-20 mx-auto mb-3" />
                        <p>No workouts recorded yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
