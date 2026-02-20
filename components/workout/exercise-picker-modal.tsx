"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Dumbbell, Activity, Plus } from "lucide-react"
import type { Exercise } from "@/lib/supabase/data-hooks"

const CATEGORIES = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"]

interface ExercisePickerModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (exercise: Exercise) => void
    exercises: Exercise[]
}

export function ExercisePickerModal({ isOpen, onClose, onSelect, exercises }: ExercisePickerModalProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [activeCategory, setActiveCategory] = useState("All")

    const filtered = useMemo(() => {
        return exercises.filter(ex => {
            const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = activeCategory === "All" || ex.category === activeCategory
            return matchesSearch && matchesCategory
        })
    }, [exercises, searchQuery, activeCategory])

    const grouped = useMemo(() => {
        if (activeCategory !== "All") return { [activeCategory]: filtered }

        const groups: Record<string, Exercise[]> = {}
        for (const ex of filtered) {
            const cat = ex.category || "Other"
            if (!groups[cat]) groups[cat] = []
            groups[cat].push(ex)
        }
        return groups
    }, [filtered, activeCategory])

    const handleSelect = (exercise: Exercise) => {
        onSelect(exercise)
        setSearchQuery("")
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent className="sm:max-w-[600px] bg-slate-950 border-slate-800 text-slate-50 p-0 max-h-[80vh] flex flex-col">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 text-indigo-400" />
                        Add Exercise
                    </DialogTitle>

                    {/* Search */}
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            placeholder="Search exercises..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:ring-indigo-500"
                            autoFocus
                        />
                    </div>

                    {/* Category Pills */}
                    <div className="flex overflow-x-auto gap-2 pt-3 pb-2 scrollbar-hide">
                        {CATEGORIES.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors border ${activeCategory === category
                                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50"
                                    : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </DialogHeader>

                {/* Exercise List */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {Object.entries(grouped).length === 0 ? (
                        <div className="py-12 text-center text-slate-500">
                            <Dumbbell className="w-8 h-8 opacity-20 mx-auto mb-3" />
                            <p className="text-sm">No exercises found matching &quot;{searchQuery}&quot;</p>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([category, exList]) => (
                            <div key={category} className="mb-4">
                                {activeCategory === "All" && (
                                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 px-1">
                                        {category}
                                    </h3>
                                )}
                                <div className="space-y-1">
                                    {exList.map(exercise => (
                                        <button
                                            key={exercise.id}
                                            onClick={() => handleSelect(exercise)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-900 transition-colors group text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-lg ${exercise.exercise_type === 'Strength' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                    {exercise.exercise_type === 'Strength'
                                                        ? <Dumbbell className="w-4 h-4" />
                                                        : <Activity className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">
                                                        {exercise.name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 ml-2">
                                                        {exercise.equipment}
                                                    </span>
                                                </div>
                                            </div>
                                            <Plus className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
