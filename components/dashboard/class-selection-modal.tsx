"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Shield, Sword, Wind, Sparkles } from "lucide-react"

export function ClassSelectionModal({ isOpen, onSelectClass }: { isOpen: boolean, onSelectClass: (c: string) => void }) {
    const [selectedClass, setSelectedClass] = useState<string | null>(null)

    const CLASSES = [
        {
            id: "Tank",
            name: "Tank",
            icon: Shield,
            stat: "STR",
            description: "Immovable. Unstoppable. +15% XP on heavy compound lifts (Squat, Deadlift, Bench, OHP).",
            color: "text-red-400",
            bg: "bg-red-400/10 hover:bg-red-400/20",
            border: "border-red-400/30",
            selectedBorder: "border-red-400 ring-4 ring-red-400/20"
        },
        {
            id: "Rogue",
            name: "Rogue",
            icon: Wind,
            stat: "DEX",
            description: "First in, last out. +15% XP on Cardio, HIIT, Jump Rope, and Mobility work.",
            color: "text-emerald-400",
            bg: "bg-emerald-400/10 hover:bg-emerald-400/20",
            border: "border-emerald-400/30",
            selectedBorder: "border-emerald-400 ring-4 ring-emerald-400/20"
        },
        {
            id: "Paladin",
            name: "Paladin",
            icon: Sword,
            stat: "CON",
            description: "Volume is virtue. +15% XP on high-volume accessory work and supersets.",
            color: "text-blue-400",
            bg: "bg-blue-400/10 hover:bg-blue-400/20",
            border: "border-blue-400/30",
            selectedBorder: "border-blue-400 ring-4 ring-blue-400/20"
        },
        {
            id: "Wizard",
            name: "Wizard",
            icon: Sparkles,
            stat: "WIS",
            description: "Mind over matter. +15% XP on Core, Yoga, Mobility, and Recovery exercises.",
            color: "text-purple-400",
            bg: "bg-purple-400/10 hover:bg-purple-400/20",
            border: "border-purple-400/30",
            selectedBorder: "border-purple-400 ring-4 ring-purple-400/20"
        }
    ]

    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-[900px] bg-slate-950 border-slate-800 text-slate-50 p-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-slate-950 to-purple-500/10 pointer-events-none" />

                <div className="p-8 relative z-10 space-y-6">
                    <DialogHeader className="text-center space-y-2">
                        <DialogTitle className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            Level 6 Reached
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-base">
                            You have grown stronger. It is time to choose your path.
                            Your class grants you bonus XP for your preferred training style.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        {CLASSES.map(cls => (
                            <button
                                key={cls.id}
                                onClick={() => setSelectedClass(cls.id)}
                                className={`flex flex-col items-center text-center p-6 rounded-2xl border transition-all duration-300 ${cls.bg} ${selectedClass === cls.id ? cls.selectedBorder : cls.border
                                    }`}
                            >
                                <div className={`p-4 rounded-full bg-slate-950 mb-4 inline-flex items-center justify-center border ${cls.border} ${cls.color}`}>
                                    <cls.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-200 mb-1">{cls.name}</h3>
                                <span className={`text-[11px] uppercase tracking-widest font-bold ${cls.color} mb-3`}>
                                    Specialty: {cls.stat}
                                </span>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {cls.description}
                                </p>
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-center pt-6">
                        <Button
                            size="lg"
                            disabled={!selectedClass}
                            onClick={() => {
                                if (selectedClass) onSelectClass(selectedClass)
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-6 text-lg font-bold rounded-xl shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                        >
                            Confirm Class Selection
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
