"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Dumbbell, Activity, Zap, ChevronRight, ChevronDown, LayoutTemplate } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Template {
    id: string
    name: string
    description: string | null
    category: string | null
    exercises: { name: string, exercise_type: string, default_sets: number }[]
}

interface TemplatePickerProps {
    onSelectTemplate: (exerciseNames: string[]) => void
    defaultOpen?: boolean
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Dumbbell, color: string, bg: string }> = {
    'Push': { icon: Dumbbell, color: 'text-red-400', bg: 'bg-red-400/10' },
    'Pull': { icon: Dumbbell, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    'Legs': { icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    'Upper': { icon: Dumbbell, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    'Full Body': { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    'Cardio': { icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
}

export function TemplatePicker({ onSelectTemplate, defaultOpen = true }: TemplatePickerProps) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(defaultOpen)

    useEffect(() => {
        const loadTemplates = async () => {
            const supabase = createClient()
            const { data, error } = await (supabase.from as any)('workout_templates')
                .select(`
                    id, name, description, category,
                    workout_template_exercises (
                        sort_order, default_sets,
                        exercises (name, exercise_type)
                    )
                `)
                .order('name', { ascending: true })

            if (error || !data) {
                setLoading(false)
                return
            }

            const formatted: Template[] = data.map((t: any) => ({
                id: t.id,
                name: t.name,
                description: t.description,
                category: t.category,
                exercises: (t.workout_template_exercises || [])
                    .sort((a: any, b: any) => a.sort_order - b.sort_order)
                    .map((te: any) => ({
                        name: te.exercises?.name || 'Unknown',
                        exercise_type: te.exercises?.exercise_type || 'Strength',
                        default_sets: te.default_sets || 3,
                    }))
            }))

            setTemplates(formatted)
            setLoading(false)
        }

        loadTemplates()
    }, [])

    if (loading || templates.length === 0) return null

    return (
        <div className="space-y-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 w-full text-left py-2 active:opacity-70 transition-opacity"
            >
                <LayoutTemplate className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex-1">Templates</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            </button>

            {isOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {templates.map(template => {
                        const config = CATEGORY_CONFIG[template.category || 'Full Body'] || CATEGORY_CONFIG['Full Body']
                        const Icon = config.icon

                        return (
                            <Card
                                key={template.id}
                                className="border-slate-800/60 bg-slate-900/40 active:bg-slate-900/80 hover:bg-slate-900/80 transition-colors cursor-pointer group"
                                onClick={() => onSelectTemplate(template.exercises.map(e => e.name))}
                            >
                                <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${config.bg} ${config.color} flex-shrink-0`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-slate-200 text-sm group-hover:text-indigo-300 transition-colors">
                                            {template.name}
                                        </h4>
                                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                            {template.exercises.map(e => e.name).join(' / ')}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
