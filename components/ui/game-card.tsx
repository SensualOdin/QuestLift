import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const variantStyles = {
    default: "border-slate-700/50 bg-gradient-to-b from-slate-900/80 to-slate-950/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
    amber: "border-amber-900/50 bg-gradient-to-br from-slate-900/80 to-amber-950/20 shadow-[inset_0_1px_0_rgba(251,191,36,0.08)]",
    danger: "border-red-900/50 bg-gradient-to-b from-slate-900/80 to-red-950/15 shadow-[inset_0_1px_0_rgba(239,68,68,0.06)]",
    epic: "border-purple-800/40 bg-gradient-to-b from-slate-900/80 to-purple-950/15 shadow-[inset_0_1px_0_rgba(168,85,247,0.06),_0_0_12px_rgba(168,85,247,0.1)]",
    legendary: "border-yellow-700/40 bg-gradient-to-b from-slate-900/80 to-yellow-950/10 shadow-[inset_0_1px_0_rgba(234,179,8,0.08),_0_0_16px_rgba(234,179,8,0.12)]",
}

interface GameCardProps {
    variant?: keyof typeof variantStyles
    className?: string
    children: React.ReactNode
    withTopAccent?: boolean
}

export function GameCard({ variant = "default", className, children, withTopAccent = false }: GameCardProps) {
    return (
        <Card className={cn(
            "relative overflow-hidden backdrop-blur-xl",
            variantStyles[variant],
            className
        )}>
            {withTopAccent && (
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            )}
            {children}
        </Card>
    )
}
