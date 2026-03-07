"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Flame, Loader2 } from "lucide-react"
import { createCustomWod, fetchAllExercises, type WodTemplate, type WodMovement, type Exercise } from "@/lib/supabase/data-hooks"
import { useUserStore } from "@/lib/store/user-store"

const WOD_TYPES = [
    { value: 'amrap', label: 'AMRAP', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30' },
    { value: 'for_time', label: 'For Time', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30' },
    { value: 'emom', label: 'EMOM', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30' },
    { value: 'chipper', label: 'Chipper', color: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' },
    { value: 'tabata', label: 'Tabata', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30 hover:bg-pink-500/30' },
] as const

type WodType = typeof WOD_TYPES[number]['value']

const TIMED_TYPES: WodType[] = ['amrap', 'emom', 'tabata']
const ROUND_TYPES: WodType[] = ['for_time', 'chipper']

interface MovementEntry {
    exercise_name: string
    reps: string
    weight_lbs: string
    notes: string
}

const emptyMovement = (): MovementEntry => ({
    exercise_name: '',
    reps: '',
    weight_lbs: '',
    notes: '',
})

function ExerciseAutocomplete({
    exercises,
    value,
    onChange,
}: {
    exercises: Exercise[]
    value: string
    onChange: (name: string) => void
}) {
    const [showDropdown, setShowDropdown] = useState(false)
    const [highlightIndex, setHighlightIndex] = useState(0)
    const blurTimeout = useRef<ReturnType<typeof setTimeout>>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const filtered = useMemo(() => {
        if (!value.trim()) return []
        return exercises
            .filter(ex => ex.name.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 6)
    }, [exercises, value])

    function handleSelect(name: string) {
        onChange(name)
        setShowDropdown(false)
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (!showDropdown || filtered.length === 0) return
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlightIndex(i => Math.min(i + 1, filtered.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightIndex(i => Math.max(i - 1, 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            handleSelect(filtered[highlightIndex].name)
        } else if (e.key === 'Escape') {
            setShowDropdown(false)
        }
    }

    return (
        <div className="relative flex-1" ref={containerRef}>
            <Input
                value={value}
                onChange={(e) => {
                    onChange(e.target.value)
                    setShowDropdown(true)
                    setHighlightIndex(0)
                }}
                onFocus={() => { if (value.trim()) setShowDropdown(true) }}
                onBlur={() => {
                    blurTimeout.current = setTimeout(() => setShowDropdown(false), 150)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Exercise name"
                className="bg-slate-800/40 border-slate-700 text-white placeholder:text-slate-500 text-sm h-9 focus-visible:ring-amber-500/50"
            />
            {showDropdown && filtered.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                    {filtered.map((ex, i) => (
                        <button
                            key={ex.id}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault()
                                if (blurTimeout.current) clearTimeout(blurTimeout.current)
                                handleSelect(ex.name)
                            }}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                                i === highlightIndex
                                    ? 'bg-amber-500/15 text-amber-300'
                                    : 'text-slate-200 hover:bg-slate-800'
                            }`}
                        >
                            <span>{ex.name}</span>
                            <span className="text-[10px] text-slate-500 ml-2 shrink-0">
                                {ex.category}{ex.equipment ? ` · ${ex.equipment}` : ''}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

interface CustomWodBuilderModalProps {
    isOpen: boolean
    onClose: () => void
    onCreated: (wod: WodTemplate, startImmediately: boolean) => void
}

export function CustomWodBuilderModal({ isOpen, onClose, onCreated }: CustomWodBuilderModalProps) {
    const { user } = useUserStore()
    const [exercises, setExercises] = useState<Exercise[]>([])

    useEffect(() => {
        if (isOpen && exercises.length === 0) {
            fetchAllExercises().then(setExercises)
        }
    }, [isOpen])

    const [name, setName] = useState('')
    const [wodType, setWodType] = useState<WodType>('amrap')
    const [timeCap, setTimeCap] = useState('')
    const [rounds, setRounds] = useState('')
    const [movements, setMovements] = useState<MovementEntry[]>([emptyMovement()])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const showTimeCap = TIMED_TYPES.includes(wodType)
    const showRounds = ROUND_TYPES.includes(wodType)

    function resetForm() {
        setName('')
        setWodType('amrap')
        setTimeCap('')
        setRounds('')
        setMovements([emptyMovement()])
        setError('')
        setSaving(false)
    }

    function handleClose() {
        resetForm()
        onClose()
    }

    function updateMovement(index: number, field: keyof MovementEntry, value: string) {
        setMovements(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
    }

    function addMovement() {
        setMovements(prev => [...prev, emptyMovement()])
    }

    function removeMovement(index: number) {
        if (movements.length <= 1) return
        setMovements(prev => prev.filter((_, i) => i !== index))
    }

    function validate(): string | null {
        if (!name.trim()) return 'WOD name is required'
        if (showTimeCap && !timeCap) return 'Time cap is required for this WOD type'
        if (showRounds && !rounds) return 'Number of rounds is required for this WOD type'

        const validMovements = movements.filter(m => m.exercise_name.trim())
        if (validMovements.length === 0) return 'Add at least one movement'

        for (const m of validMovements) {
            if (!m.reps || parseInt(m.reps) <= 0) return `Reps required for ${m.exercise_name}`
        }
        return null
    }

    async function handleSave(startImmediately: boolean) {
        const validationError = validate()
        if (validationError) {
            setError(validationError)
            return
        }
        if (!user) return

        setSaving(true)
        setError('')

        const validMovements: WodMovement[] = movements
            .filter(m => m.exercise_name.trim())
            .map(m => ({
                exercise_name: m.exercise_name.trim(),
                reps: parseInt(m.reps),
                weight_lbs: m.weight_lbs ? parseInt(m.weight_lbs) : null,
                notes: m.notes.trim(),
            }))

        const timeCapSeconds = timeCap ? parseInt(timeCap) * 60 : null

        const result = await createCustomWod({
            name: name.trim(),
            wod_type: wodType,
            time_cap_seconds: timeCapSeconds,
            rounds: rounds ? parseInt(rounds) : null,
            created_by: user.id,
            movements: validMovements,
        })

        setSaving(false)

        if (!result) {
            setError('Failed to save WOD. Please try again.')
            return
        }

        resetForm()
        onCreated(result, startImmediately)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
            <DialogContent className="sm:max-w-[500px] bg-slate-950 border-amber-500/30 text-slate-50 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-amber-400 font-cinzel flex items-center gap-2">
                        <Flame className="w-5 h-5" />
                        Create Custom WOD
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* WOD Name */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400 uppercase tracking-wider">WOD Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Monday Mayhem"
                            className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-amber-500/50"
                        />
                    </div>

                    {/* WOD Type */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400 uppercase tracking-wider">Type</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {WOD_TYPES.map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setWodType(t.value)}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                                        wodType === t.value
                                            ? t.color + ' ring-1 ring-current'
                                            : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Cap */}
                    {showTimeCap && (
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-400 uppercase tracking-wider">Time Cap (minutes)</Label>
                            <Input
                                type="number"
                                min="1"
                                value={timeCap}
                                onChange={(e) => setTimeCap(e.target.value)}
                                placeholder="e.g. 20"
                                className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-amber-500/50 w-32"
                            />
                        </div>
                    )}

                    {/* Rounds */}
                    {showRounds && (
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-400 uppercase tracking-wider">Rounds</Label>
                            <Input
                                type="number"
                                min="1"
                                value={rounds}
                                onChange={(e) => setRounds(e.target.value)}
                                placeholder="e.g. 5"
                                className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-amber-500/50 w-32"
                            />
                        </div>
                    )}

                    {/* Optional time cap for For Time / Chipper */}
                    {showRounds && (
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-400 uppercase tracking-wider">Time Cap (optional, minutes)</Label>
                            <Input
                                type="number"
                                min="1"
                                value={timeCap}
                                onChange={(e) => setTimeCap(e.target.value)}
                                placeholder="No cap"
                                className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-amber-500/50 w-32"
                            />
                        </div>
                    )}

                    {/* Movements */}
                    <div className="space-y-2">
                        <Label className="text-xs text-slate-400 uppercase tracking-wider">Movements</Label>
                        <div className="space-y-3">
                            {movements.map((m, i) => (
                                <div key={i} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-500 w-5 shrink-0">{i + 1}.</span>
                                        <ExerciseAutocomplete
                                            exercises={exercises}
                                            value={m.exercise_name}
                                            onChange={(val) => updateMovement(i, 'exercise_name', val)}
                                        />
                                        {movements.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeMovement(i)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-2 pl-7">
                                        <div className="w-20">
                                            <Input
                                                type="number"
                                                min="1"
                                                value={m.reps}
                                                onChange={(e) => updateMovement(i, 'reps', e.target.value)}
                                                placeholder="Reps"
                                                className="bg-slate-800/40 border-slate-700 text-white placeholder:text-slate-500 text-sm h-9 focus-visible:ring-amber-500/50"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={m.weight_lbs}
                                                onChange={(e) => updateMovement(i, 'weight_lbs', e.target.value)}
                                                placeholder="lbs"
                                                className="bg-slate-800/40 border-slate-700 text-white placeholder:text-slate-500 text-sm h-9 focus-visible:ring-amber-500/50"
                                            />
                                        </div>
                                        <Input
                                            value={m.notes}
                                            onChange={(e) => updateMovement(i, 'notes', e.target.value)}
                                            placeholder="Notes (optional)"
                                            className="bg-slate-800/40 border-slate-700 text-white placeholder:text-slate-500 text-sm h-9 focus-visible:ring-amber-500/50"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addMovement}
                            className="w-full border-dashed border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 hover:bg-amber-500/5"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Add Movement
                        </Button>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            variant="outline"
                            className="flex-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                            Save
                        </Button>
                        <Button
                            onClick={() => handleSave(true)}
                            disabled={saving}
                            className="flex-1 bg-amber-500 text-black hover:bg-amber-400 active:bg-amber-600 font-bold"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                            Save & Start
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
