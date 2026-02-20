"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Dumbbell, Activity, Plus } from "lucide-react"
import { fetchAllExercises, type Exercise } from "@/lib/supabase/data-hooks"
import { Skeleton } from "@/components/ui/skeleton"

const CATEGORIES = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"]

export function ExerciseLibrary() {
    const [searchQuery, setSearchQuery] = useState("")
    const [activeCategory, setActiveCategory] = useState("All")

    const [exercises, setExercises] = useState<Exercise[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchAllExercises()
            setExercises(data)
            setLoading(false)
        }
        loadData()
    }, [])

    const filteredExercises = exercises.filter((ex) => {
        const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = activeCategory === "All" || ex.category === activeCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Dumbbell className="w-6 h-6 text-indigo-400" />
                        Grimoire of Iron
                    </h2>
                    <p className="text-sm text-slate-400">Select exercises to add to your current quest.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Search exercises..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Categories (Pills) */}
            <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 gap-2 scrollbar-hide">
                {CATEGORIES.map(category => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${activeCategory === category
                            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl bg-slate-800" />)
                ) : filteredExercises.length > 0 ? (
                    filteredExercises.map(exercise => (
                        <Card key={exercise.id} className="bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/60 transition-colors group cursor-pointer">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                                        {exercise.name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800/80">
                                            {exercise.category}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            {exercise.exercise_type === 'Cardio' ? <Activity className="w-3 h-3" /> : <Dumbbell className="w-3 h-3" />}
                                            {exercise.equipment}
                                        </span>
                                    </div>
                                </div>
                                <button className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-slate-500">
                        <Dumbbell className="w-8 h-8 opacity-20 mx-auto mb-3" />
                        <p>No exercises found matching &quot;{searchQuery}&quot;.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
