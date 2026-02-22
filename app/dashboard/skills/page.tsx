"use client"

import { useEffect, useState, useCallback } from "react"
import { Lock, Sparkles, Zap, Shield, Sword, Eye, Wind, Target, Heart, Flame, BookOpen, Star, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUserStore } from "@/lib/store/user-store"
import { createClient } from "@/lib/supabase/client"
import { fetchSkillTree, getAvailableSkillPoints, allocateSkillPoint } from "@/lib/supabase/data-hooks"
import { motion, AnimatePresence } from "framer-motion"

interface SkillNode {
    id: string
    class_name: string
    branch: string
    tier: number
    name: string
    description: string
    effect_type: string
    effect_value: number
    effect_target: string | null
    icon: string
}

const CLASS_COLORS: Record<string, { primary: string, glow: string, bg: string, border: string, text: string, ring: string }> = {
    Tank: {
        primary: 'text-red-500',
        glow: 'shadow-red-500/50',
        bg: 'bg-red-500/10',
        border: 'border-red-500/40',
        text: 'text-red-400',
        ring: 'ring-red-500/60',
    },
    Rogue: {
        primary: 'text-emerald-500',
        glow: 'shadow-emerald-500/50',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/40',
        text: 'text-emerald-400',
        ring: 'ring-emerald-500/60',
    },
    Paladin: {
        primary: 'text-blue-500',
        glow: 'shadow-blue-500/50',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/40',
        text: 'text-blue-400',
        ring: 'ring-blue-500/60',
    },
    Wizard: {
        primary: 'text-purple-500',
        glow: 'shadow-purple-500/50',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/40',
        text: 'text-purple-400',
        ring: 'ring-purple-500/60',
    },
}

const ICON_MAP: Record<string, typeof Zap> = {
    Zap,
    Shield,
    Sword,
    Eye,
    Wind,
    Target,
    Heart,
    Flame,
    BookOpen,
    Star,
    Sparkles,
    Lock,
}

function getNodeIcon(iconName: string) {
    return ICON_MAP[iconName] || Star
}

export default function SkillTreePage() {
    const { user, refreshProfile } = useUserStore()
    const [nodes, setNodes] = useState<SkillNode[]>([])
    const [allocatedIds, setAllocatedIds] = useState<Set<string>>(new Set())
    const [totalAllocated, setTotalAllocated] = useState(0)
    const [loading, setLoading] = useState(true)
    const [allocating, setAllocating] = useState<string | null>(null)
    const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null)
    const [error, setError] = useState<string | null>(null)

    const className = (user as any)?.class_name || ''
    const level = user?.level || 1
    const availablePoints = getAvailableSkillPoints(level)
    const remainingPoints = availablePoints - totalAllocated
    const colors = CLASS_COLORS[className] || CLASS_COLORS.Tank

    const loadSkillTree = useCallback(async () => {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.id || !className) return

        try {
            const result = await fetchSkillTree(session.user.id, className)
            setNodes(result.nodes)
            setAllocatedIds(result.allocatedIds)
            setTotalAllocated(result.totalAllocated)
        } catch (err) {
            console.error('Error loading skill tree:', err)
        } finally {
            setLoading(false)
        }
    }, [className])

    useEffect(() => {
        loadSkillTree()
    }, [loadSkillTree])

    const handleAllocate = async (node: SkillNode) => {
        if (!user?.id || allocating) return
        setAllocating(node.id)
        setError(null)

        const result = await allocateSkillPoint(user.id, node.id, className)

        if (result.success) {
            setAllocatedIds(prev => new Set([...prev, node.id]))
            setTotalAllocated(prev => prev + 1)
            setSelectedNode(null)
            await refreshProfile()
        } else {
            setError(result.error || 'Failed to allocate skill point')
        }

        setAllocating(null)
    }

    // Group nodes by branch
    const branches = new Map<string, SkillNode[]>()
    for (const node of nodes) {
        const existing = branches.get(node.branch) || []
        existing.push(node)
        branches.set(node.branch, existing)
    }

    // Sort each branch by tier
    for (const [, branchNodes] of branches) {
        branchNodes.sort((a, b) => a.tier - b.tier)
    }

    const branchEntries = [...branches.entries()]

    const getNodeStatus = (node: SkillNode): 'allocated' | 'available' | 'locked' => {
        if (allocatedIds.has(node.id)) return 'allocated'
        if (remainingPoints <= 0) return 'locked'
        if (node.tier === 1) return 'available'

        // Check prerequisite: tier - 1 in same branch must be allocated
        const branchNodes = branches.get(node.branch) || []
        const prereq = branchNodes.find(n => n.tier === node.tier - 1)
        if (prereq && allocatedIds.has(prereq.id)) return 'available'

        return 'locked'
    }

    if (!className) {
        return (
            <div className="max-w-4xl mx-auto px-4 pb-28 sm:pb-8">
                <Card className="bg-slate-900/80 border-slate-800">
                    <CardContent className="p-8 text-center">
                        <Sparkles className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Choose a Class First</h2>
                        <p className="text-slate-400">Select a class from the Inn to unlock your skill tree.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 pb-28 sm:pb-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-800 rounded w-1/3" />
                    <div className="h-4 bg-slate-800 rounded w-1/2" />
                    <div className="grid grid-cols-3 gap-4 mt-8">
                        {[...Array(9)].map((_, i) => (
                            <div key={i} className="h-24 bg-slate-800 rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 pb-28 sm:pb-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className={`text-2xl font-bold ${colors.text} mb-1 font-cinzel`}>
                    {className} Skill Tree
                </h1>
                <p className="text-slate-400 text-sm">
                    Unlock powerful passive bonuses as you level up.
                </p>
            </div>

            {/* Points Display */}
            <Card className={`mb-6 bg-slate-900/80 border-slate-800`}>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                                <Sparkles className={`w-5 h-5 ${colors.primary}`} />
                            </div>
                            <div>
                                <p className="text-white font-semibold">Skill Points</p>
                                <p className="text-slate-400 text-xs">Earned at levels 10, 15, 20, 25, 30, 35, 40, 45, 50+</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`text-2xl font-bold ${remainingPoints > 0 ? colors.text : 'text-slate-500'}`}>
                                {remainingPoints}
                            </p>
                            <p className="text-slate-500 text-xs">{totalAllocated} / {availablePoints} used</p>
                        </div>
                    </div>
                    {availablePoints === 0 && (
                        <p className="text-slate-500 text-xs mt-3 text-center">
                            Reach level 10 to earn your first skill point.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Skill Tree Grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
                {branchEntries.map(([branchName, branchNodes]) => (
                    <div key={branchName} className="flex flex-col items-center gap-0">
                        {/* Branch Header */}
                        <h3 className={`text-xs sm:text-sm font-bold ${colors.text} mb-3 text-center tracking-wider uppercase`}>
                            {branchName}
                        </h3>

                        {/* Nodes */}
                        <div className="flex flex-col items-center gap-0">
                            {branchNodes.map((node, index) => {
                                const status = getNodeStatus(node)
                                const Icon = getNodeIcon(node.icon)
                                const isSelected = selectedNode?.id === node.id

                                return (
                                    <div key={node.id} className="flex flex-col items-center">
                                        {/* Connector line */}
                                        {index > 0 && (
                                            <div className={`w-0.5 h-4 sm:h-6 ${
                                                status === 'allocated' || getNodeStatus(branchNodes[index - 1]) === 'allocated'
                                                    ? colors.border.replace('border-', 'bg-')
                                                    : 'bg-slate-700/50'
                                            }`} />
                                        )}

                                        {/* Node */}
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setSelectedNode(isSelected ? null : node)}
                                            className={`
                                                relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all duration-200
                                                ${status === 'allocated'
                                                    ? `${colors.border} ${colors.bg} shadow-lg ${colors.glow}`
                                                    : status === 'available'
                                                        ? `border-slate-600 bg-slate-800/80 hover:${colors.border} hover:${colors.bg}`
                                                        : 'border-slate-800 bg-slate-900/50 opacity-50 cursor-not-allowed'
                                                }
                                                ${isSelected ? `ring-2 ${colors.ring}` : ''}
                                            `}
                                        >
                                            {status === 'locked' ? (
                                                <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                                            ) : (
                                                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${
                                                    status === 'allocated' ? colors.primary : 'text-slate-400'
                                                }`} />
                                            )}
                                            <span className={`text-[9px] sm:text-[10px] font-semibold leading-tight text-center px-0.5 ${
                                                status === 'allocated' ? 'text-white' : 'text-slate-500'
                                            }`}>
                                                {node.name.length > 10 ? node.name.slice(0, 9) + '..' : node.name}
                                            </span>

                                            {/* Tier badge */}
                                            <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center ${
                                                status === 'allocated'
                                                    ? `${colors.bg.replace('/10', '/80')} ${colors.primary} border ${colors.border}`
                                                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                                            }`}>
                                                {node.tier}
                                            </span>
                                        </motion.button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Selected Node Detail */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="mt-6"
                    >
                        <Card className={`bg-slate-900/90 border-slate-800`}>
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                                        {(() => {
                                            const NodeIcon = getNodeIcon(selectedNode.icon)
                                            return <NodeIcon className={`w-6 h-6 ${colors.primary}`} />
                                        })()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-white font-bold text-lg">{selectedNode.name}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-semibold`}>
                                                Tier {selectedNode.tier}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-sm mb-1">{selectedNode.branch} Branch</p>
                                        <p className="text-slate-300 text-sm mb-3">{selectedNode.description}</p>

                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${colors.bg} mb-4`}>
                                            <Zap className={`w-3.5 h-3.5 ${colors.primary}`} />
                                            <span className={`text-xs font-semibold ${colors.text}`}>
                                                +{selectedNode.effect_value}% {selectedNode.effect_type.replace(/_/g, ' ')}
                                                {selectedNode.effect_target ? ` (${selectedNode.effect_target})` : ''}
                                            </span>
                                        </div>

                                        {(() => {
                                            const status = getNodeStatus(selectedNode)
                                            if (status === 'allocated') {
                                                return (
                                                    <div className={`flex items-center gap-2 ${colors.text}`}>
                                                        <Sparkles className="w-4 h-4" />
                                                        <span className="text-sm font-semibold">Active</span>
                                                    </div>
                                                )
                                            }
                                            if (status === 'available') {
                                                return (
                                                    <Button
                                                        onClick={() => handleAllocate(selectedNode)}
                                                        disabled={!!allocating}
                                                        className={`${colors.bg} ${colors.text} hover:opacity-90 border ${colors.border}`}
                                                        variant="outline"
                                                    >
                                                        {allocating === selectedNode.id ? 'Allocating...' : 'Allocate Skill Point'}
                                                    </Button>
                                                )
                                            }
                                            return (
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Lock className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        {remainingPoints <= 0
                                                            ? 'No skill points available'
                                                            : 'Unlock previous tier first'
                                                        }
                                                    </span>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty state when no nodes */}
            {nodes.length === 0 && !loading && (
                <Card className="bg-slate-900/80 border-slate-800 mt-6">
                    <CardContent className="p-8 text-center">
                        <Sparkles className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Skill Tree Coming Soon</h2>
                        <p className="text-slate-400">No skill tree data found for {className}. Check back later.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
